import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import CouponsClient from "./CouponsClient"

export default async function AdminCouponsPage() {
  const admin = await isAdmin()
  if (!admin) redirect("/dashboard")

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { usages: true } } },
  })

  return <CouponsClient initialCoupons={coupons} />
}
