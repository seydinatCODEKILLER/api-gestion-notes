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

  async register(userData) {
    const existingUser = await prisma.user.findUnique({ 
      where: { email: userData.email } 
    })
    
    if (existingUser) throw new Error('Email déjà utilisé')

    const hashedPassword = await this.passwordHasher.hash(userData.password)
    const avatarUrl = userData.avatar 
      ? await this.avatarUploader.upload(userData.avatar, userData.prenom)
      : null

    return prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        avatar: avatarUrl
      },
      select: this.userSelectFields
    })
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

  get userSelectFields() {
    return {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      avatar: true
    }
  }

  filterUserFields(user) {
    const { password, ...safeFields } = user
    return safeFields
  }
}