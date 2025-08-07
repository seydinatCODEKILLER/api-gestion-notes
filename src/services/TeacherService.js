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
}
