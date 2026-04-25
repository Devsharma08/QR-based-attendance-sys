import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.user.create({
    data: {
      email: "professor" + Date.now() + "@college.edu",
      name: "Prof. Testing",
      role: "TEACHER",
      id: "teacher1"
    }
  });

  console.log("==========================================");
  console.log("✅ SUCCESSFULLY CREATED A TEACHER!");
  console.log("Copy this exact ID and paste it into the 'Teacher UUID' box:");
  console.log(teacher.id);
  console.log("==========================================");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
