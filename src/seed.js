import { prisma } from "./config/database.js";
import bcrypt from 'bcrypt';


async function main() {
  const passwordHash = await bcrypt.hash('Liverpool040', 10);
  console.log(passwordHash);

  await prisma.user.create({
    data: {
    nom: "Thiam",
    prenom: "seydina",
    telephone: "776543421",
    avatar: "https://res.cloudinary.com/dvzo0zlpg/image/upload/v1753441609/o4ywitqxwa3pvgj3cef4.jpg",
    adresse: "Dakar",
      email: 'seydinat235@gmail.com',
      password: passwordHash,
      role: 'admin',
    },
  });

  console.log('Seed terminé !');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  
