import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateToken(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluidos caracteres confusos como O, 0, 1, I
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function main() {
  const quantity = parseInt(process.argv[2]) || 5; // Por defecto genera 5 tarjetas
  console.log(`\nGenerando ${quantity} tarjetas NFC...\n`);

  for (let i = 0; i < quantity; i++) {
    const token = generateToken();
    try {
      const card = await prisma.nfcCard.create({
        data: {
          token
        }
      });
      console.log(`✅ ID: ${card.id} | Link a grabar en chip: /c/${card.token}`);
    } catch (e) {
      console.error(`Error generando token ${token}, reintentando...`);
      i--; // Reintentar si por casualidad se repitió el token
    }
  }

  console.log('\n¡Tarjetas listas! Cópialas y guárdalas donde necesites.\n');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
