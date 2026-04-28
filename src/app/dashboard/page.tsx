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
      businessConfig: true,
      campaign: true,
      teamMembers: { orderBy: { order: 'asc' } },
      quoteForm: { include: { submissions: { orderBy: { createdAt: 'desc' }, take: 50 } } },
      referrals: { orderBy: { createdAt: 'desc' } },
      accounts: { select: { provider: true } },
    },
  })

  const hasPassword = !!user?.password
  const isOAuth = (user?.accounts ?? []).some(a => a.provider !== 'credentials')

  const bookings = user?.bookingConfig
    ? await prisma.booking.findMany({
        where: { configId: user.bookingConfig.id },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const scanLogs = await prisma.scanLog.findMany({
    where: { userId: session.user.id, createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const bookingsThisWeek = bookings.filter(b => new Date(b.createdAt) >= weekAgo).length
  const messagesThisMonth = (user?.contactMessages ?? []).filter(m => new Date(m.createdAt) >= monthAgo).length
  const totalClicks = (user?.links ?? []).reduce((sum, l) => sum + l.clicks, 0)
  const profileViews = user?.profileViews ?? 0

  const signOutAction = async () => {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return (
    <DashboardClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user={user as any}
      signOutAction={signOutAction}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bookings={bookings as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scanLogs={scanLogs as any}
      stats={{ profileViews, totalClicks, bookingsThisWeek, messagesThisMonth }}
      accountMeta={{ hasPassword, isOAuth, createdAt: user?.createdAt ?? new Date() }}
    />
  )
}
