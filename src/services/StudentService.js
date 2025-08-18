import { prisma } from "../config/database.js";
import PasswordHasher from "../utils/hash.js";
import AvatarUploader from "../utils/uploadAvatar.js";

export default class StudentService {
  constructor() {
    this.passwordHasher = new PasswordHasher();
    this.avatarUploader = new AvatarUploader();
  }

  async getAllStudents(options = {}) {
    const {
      includeInactive = false,
      search = "",
      classId,
      page = 1,
      pageSize = 10,
    } = options;

    return prisma.student.findMany({
      where: {
        AND: [
          {
            user: {
              statut: includeInactive ? undefined : "actif",
              OR: search
                ? [
                    { nom: { contains: search, mode: "insensitive" } },
                    { prenom: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                  ]
                : undefined,
            },
          },
          classId ? { classId } : {},
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            avatar: true,
            statut: true,
            date_creation: true,
          },
        },
        class: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: {
        user: {
          nom: "asc",
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async countStudents(includeInactive = false, classId = undefined) {
    return prisma.student.count({
      where: {
        user: {
          statut: includeInactive ? undefined : "actif",
        },
        classId: classId || undefined,
      },
    });
  }

  async createStudent(studentData) {
    const {
      email,
      password,
      nom,
      prenom,
      telephone,
      adresse,
      avatar,
      date_naissance,
      lieu_naissance,
      nom_parent,
      telephone_parent,
      email_parent,
      classId,
    } = studentData;

    let uploadPrefix = `student_${prenom}_${nom}`.toLowerCase();
    let avatarUrl = null;

    try {
      await this.verifyEmailNotExists(prisma, email);

      avatarUrl = await this.handleAvatarUpload(avatar, uploadPrefix);

      if (classId) {
        const classExists = await prisma.class.findUnique({
          where: { id: classId },
        });
        if (!classExists) {
          throw new Error("Classe introuvable");
        }
      }

      return await prisma.$transaction(async (tx) => {
        const hashedPassword = await this.passwordHasher.hash(password);
        const createdUser = await tx.user.create({
          data: {
            nom,
            prenom,
            email,
            telephone,
            adresse,
            password: hashedPassword,
            avatar: avatarUrl,
            role: "eleve",
          },
        });

        return tx.student.create({
          data: {
            userId: createdUser.id,
            classId: classId || null,
            date_naissance: new Date(date_naissance),
            lieu_naissance,
            nom_parent,
            telephone_parent,
            email_parent,
            classId,
            date_inscription: new Date(),
          },
          include: {
            user: true,
            class: true,
          },
        });
      });
    } catch (error) {
      if (avatarUrl) await this.avatarUploader.rollback(uploadPrefix);
      throw error;
    }
  }

  async updateStudent(studentId, updateData) {
    const {
      currentPassword,
      newPassword,
      avatar,
      date_naissance,
      classId,
      ...rest
    } = updateData;

    return await prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { id: studentId },
        include: { user: true },
      });

      if (!student) throw new Error("Élève non trouvé");

      let hashedPassword = student.user.password;
      if (newPassword) {
        const isValid = await this.passwordHasher.compare(
          currentPassword,
          student.user.password
        );
        if (!isValid) throw new Error("Mot de passe actuel incorrect");
        hashedPassword = await this.passwordHasher.hash(newPassword);
      }

      let avatarUrl = student.user.avatar;
      if (avatar) {
        avatarUrl = await this.handleAvatarUpload(
          avatar,
          `${updateData.prenom || student.user.prenom}_${
            updateData.nom || student.user.nom
          }`
        );
      }

      await tx.user.update({
        where: { id: student.userId },
        data: {
          ...rest,
          password: hashedPassword,
          avatar: avatarUrl,
        },
      });

      return tx.student.update({
        where: { id: studentId },
        data: {
          date_naissance: date_naissance ? new Date(date_naissance) : undefined,
          classId: classId !== undefined ? classId : undefined,
        },
        include: {
          user: true,
          class: true,
        },
      });
    });
  }

  async setStudentStatus(studentId, action) {
    const validTransitions = {
      restore: { from: "inactif", to: "actif" },
      delete: { from: "actif", to: "inactif" },
    };

    if (!validTransitions[action]) {
      throw new Error("Action invalide. Utilisez 'delete' ou 'restore'");
    }

    const { from, to } = validTransitions[action];

    return await prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { id: studentId },
        include: { user: { select: { id: true, statut: true } } },
      });

      if (!student) throw new Error("Élève non trouvé");
      if (student.user.statut !== from) {
        throw new Error(
          `Action impossible: l'élève est ${student.user.statut}`
        );
      }

      await tx.user.update({
        where: { id: student.user.id },
        data: { statut: to },
      });

      return { id: studentId, status: to };
    });
  }

  async getStudentById(studentId) {
    return prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            avatar: true,
            adresse: true,
            date_creation: true,
            statut: true,
          },
        },
        class: {
          select: {
            id: true,
            nom: true,
            niveau: true,
          },
        },
        grades: {
          include: {
            subject: true,
            trimestre: true,
          },
        },
        averages: {
          include: {
            subject: true,
            trimestre: true,
          },
        },
      },
    });
  }

  async verifyEmailNotExists(prismaClient, email) {
    const existing = await prismaClient.user.findUnique({ where: { email } });
    if (existing) throw new Error("Email déjà utilisé");
  }

  async handleAvatarUpload(avatarFile, namePrefix) {
    if (!avatarFile) return null;
    return await this.avatarUploader.upload(avatarFile, namePrefix);
  }

  async getStats(classId) {
    const [total, active, inactive] = await Promise.all([
      prisma.student.count({
        where: classId ? { classId } : undefined,
      }),
      prisma.student.count({
        where: {
          user: { statut: "actif" },
          ...(classId ? { classId } : {}),
        },
      }),
      prisma.student.count({
        where: {
          user: { statut: "inactif" },
          ...(classId ? { classId } : {}),
        },
      }),
    ]);

    return { total, active, inactive };
  }
}
