import { prisma } from "../config/database.js";
import PasswordHasher from "../utils/hash.js";
import AvatarUploader from "../utils/uploadAvatar.js";
import TokenGenerator from "../config/jwt.js";
import AppError from "../utils/AppError.js";

export default class AuthService {
  constructor() {
    this.passwordHasher = new PasswordHasher();
    this.avatarUploader = new AvatarUploader();
    this.tokenGenerator = new TokenGenerator();
  }

  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("Identifiants invalides", 401);

    const isValid = await this.passwordHasher.compare(password, user.password);
    if (!isValid) throw new AppError("Identifiants invalides", 401);

    const payload = { id: user.id, role: user.role, email: user.email };

    return {
      token: this.tokenGenerator.sign(payload),
      refreshToken: this.tokenGenerator.signRefresh(payload),
      user: this.filterUserFields(user),
    };
  }

  filterUserFields(user) {
    const { password, ...safeFields } = user;
    return safeFields;
  }

  async getCurrentUser(token) {
      try {
        const payload = this.tokenGenerator.verify(token);
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
        });
        if (!user) throw new AppError("Utilisateur introuvable", 404);
        return this.filterUserFields(user);
      } catch {
        throw new AppError("Token invalide", 401);
      }
  }

  async refreshToken(refreshToken) {
    try {
      const payload = this.tokenGenerator.verify(refreshToken);

      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user) throw new AppError("Utilisateur introuvable", 404);

      const payloadUser = { id: user.id, role: user.role, email: user.email };

      return {
        token: this.tokenGenerator.sign(payloadUser),
        refreshToken: this.tokenGenerator.signRefresh(payloadUser),
        user: this.filterUserFields(user),
      };
    } catch {
      throw new AppError("Refresh token invalide ou expiré", 401);
    }
  }
}
