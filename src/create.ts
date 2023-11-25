import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {

  } catch (error) {
    console.log(error);
  } finally {
    async () => {
      await prisma.$disconnect();
    };
  }
}

main();