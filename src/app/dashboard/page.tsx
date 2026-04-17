import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      links: { orderBy: { order: 'asc' } },
      carouselPhotos: { orderBy: { order: 'asc' } },
      bookingConfig: true,
      contactMessages: { orderBy: { createdAt: 'desc' } },
    },
  })

  const bookings = user?.bookingConfig
    ? await prisma.booking.findMany({
        where: { configId: user.bookingConfig.id },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const signOutAction = async () => {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return <DashboardClient user={user as any} signOutAction={signOutAction} bookings={bookings as any} />
}
