import { prisma } from "../config/database.js"
import PasswordHasher from "../utils/hash.js"
import AvatarUploader from "../utils/uploadAvatar.js"
import TokenGenerator from "../config/jwt.js"

export default class AuthService {
  constructor() {
    this.passwordHasher = new PasswordHasher()
    this.avatarUploader = new AvatarUploader()
    this.tokenGenerator = new TokenGenerator()
  }

  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new Error('Identifiants invalides')

    const isValid = await this.passwordHasher.compare(password, user.password)
    if (!isValid) throw new Error('Identifiants invalides')

    return {
      token: this.tokenGenerator.sign({
        id: user.id,
        role: user.role,
        email: user.email
      }),
      user: this.filterUserFields(user)
    }
  }

  filterUserFields(user) {
    const { password, ...safeFields } = user
    return safeFields
  }
}