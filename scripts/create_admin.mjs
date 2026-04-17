import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// Prisma 7: PrismaLibSql recibe la URL directamente, sin @libsql/client
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const password = await bcrypt.hash('admin', 10)

  const existing = await prisma.user.findUnique({ where: { username: 'Admin' } })

  if (!existing) {
    const user = await prisma.user.create({
      data: {
        name: 'Administrador',
        username: 'Admin',
        email: 'admin@cloudinf.com',
        password,
      },
    })
    console.log('✅ Usuario Admin creado:', user.email)
  } else {
    console.log('ℹ️  El usuario Admin ya existe.')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
