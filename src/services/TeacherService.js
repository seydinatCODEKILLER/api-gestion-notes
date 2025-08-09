import { prisma } from "../config/database.js";
import PasswordHasher from "../utils/hash.js";
import AvatarUploader from "../utils/uploadAvatar.js";

export default class TeacherService {
  constructor() {
    this.passwordHasher = new PasswordHasher();
    this.avatarUploader = new AvatarUploader();
  }

  async getAllTeachers() {
    return prisma.teacher.findMany({
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
            statut: true,
            date_creation: true,
          },
        },
      },
      orderBy: {
        user: {
          nom: "asc",
        },
      },
    });
  }

  async createTeacher(teacherData) {
    const {
      email,
      password,
      nom,
      prenom,
      telephone,
      adresse,
      avatar,
      specialite,
      date_embauche,
    } = teacherData;

    return await prisma.$transaction(async (tx) => {
      await this.verifyEmailNotExists(tx, email);

      const hashedPassword = await this.passwordHasher.hash(password);
      const avatarUrl = await this.handleAvatarUpload(avatar, prenom);

      const createdUser = await this.createUserRecord(tx, {
        nom,
        prenom,
        email,
        telephone,
        adresse,
        password: hashedPassword,
        avatar: avatarUrl,
      });

      return this.createTeacherRecord(tx, {
        userId: createdUser.id,
        specialite,
        date_embauche,
      });
    });
  }

  async verifyEmailNotExists(prismaClient, email) {
    const existingUser = await prismaClient.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Email déjà utilisé");
    }
  }

  async handleAvatarUpload(avatarFile, namePrefix) {
    if (!avatarFile) return null;

    try {
      return await this.avatarUploader.upload(avatarFile, namePrefix);
    } catch (error) {
      console.error("Échec de l'upload de l'avatar:", error);
      return null;
    }
  }

  async createUserRecord(prismaClient, userData) {
    return prismaClient.user.create({
      data: {
        ...userData,
        role: "professeur",
      },
    });
  }

  async createTeacherRecord(prismaClient, teacherData) {
    return prismaClient.teacher.create({
      data: {
        ...teacherData,
        date_embauche: new Date(teacherData.date_embauche),
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
          },
        },
      },
    });
  }

  async updateTeacher(teacherId, updateData) {
    const {
      currentPassword,
      newPassword,
      avatar,
      date_embauche,
      specialite,
      ...rest
    } = updateData;

    return await prisma.$transaction(async (tx) => {
      const teacher = await tx.teacher.findUnique({
        where: { id: teacherId },
        include: { user: true },
      });

      if (!teacher) throw new Error("Professeur non trouvé");

      let hashedPassword = teacher.user.password;
      if (newPassword) {
        const isValid = await this.passwordHasher.compare(
          currentPassword,
          teacher.user.password
        );
        if (!isValid) throw new Error("Mot de passe actuel incorrect");
        hashedPassword = await this.passwordHasher.hash(newPassword);
      }

      let avatarUrl = teacher.user.avatar;
      if (avatar) {
        avatarUrl = await this.handleAvatarUpload(
          avatar,
          updateData.prenom || teacher.user.prenom
        );
      }

      await tx.user.update({
        where: { id: teacher.userId },
        data: {
          ...rest,
          password: hashedPassword,
          avatar: avatarUrl,
        },
      });

      return tx.teacher.update({
        where: { id: teacherId },
        data: {
          specialite: specialite,
          date_embauche: date_embauche ? new Date(date_embauche) : undefined,
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
            },
          },
        },
      });
    });
  }

  async setTeacherStatus(teacherId, action) {
    const validTransitions = {
      restore: { from: "inactif", to: "actif" },
      delete: { from: "actif", to: "inactif" },
    };

    if (!validTransitions[action]) throw new Error("Action invalide. Utilisez 'delete' ou 'restore'");
    const { from, to } = validTransitions[action];

    return await prisma.$transaction(async (tx) => {
      const teacher = await tx.teacher.findUnique({
        where: { id: teacherId },
        include: { user: { select: { id: true, statut: true } } },
      });

      if (!teacher) throw new Error("Professeur non trouvé");
      if (teacher.user.statut !== from) {
        throw new Error(
          `Action impossible: le professeur est ${teacher.user.statut}`
        );
      }

      await tx.user.update({
        where: { id: teacher.user.id },
        data: { statut: to },
      });

      return { id: teacherId, status: to };
    });
  }
}
