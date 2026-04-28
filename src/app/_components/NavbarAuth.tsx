import { auth } from '@/auth'
import Link from 'next/link'

/**
 * Server component — reads session on the server, no hydration issues.
 * Renders the correct nav auth state on first paint, no flash.
 */
export default async function NavbarAuth() {
  const session = await auth()

  if (session?.user) {
    const name = session.user.name || (session.user as { username?: string }).username || 'Usuario'
    const initials = name.slice(0, 2).toUpperCase()
    const avatar = session.user.image

    return (
      <div className="lp-nav-user">
        <Link href="/dashboard" className="lp-nav-user-link">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name} className="lp-nav-user-avatar" />
          ) : (
            <div className="lp-nav-user-initials">{initials}</div>
          )}
          <span className="lp-nav-user-name">{name.split(' ')[0]}</span>
          <i className="fa-solid fa-chevron-right lp-nav-user-arrow" />
        </Link>
      </div>
    )
  }

  return (
    <>
      <Link href="/login" className="lp-nav-login">Iniciar Sesión</Link>
      <Link href="/register" className="lp-nav-cta">Comenzar Gratis</Link>
    </>
  )
}
