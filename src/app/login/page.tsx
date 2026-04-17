"use client"

import { signIn } from "next-auth/react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoginForm() {
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      })
      if (res?.error) {
        setError("Correo o contraseña incorrectos.")
      } else {
        window.location.href = "/dashboard"
      }
    })
  }

  return (
    <main className="container flex-center">
      <div className="form-container max-w-400">
        <div className="text-center mb-2rem">
          <h1 className="name">Cloudinf</h1>
          <p className="bio">Inicia sesión en tu panel</p>
        </div>

        {registered && (
          <div className="text-success">
            ¡Cuenta creada! Ya puedes iniciar sesión.
          </div>
        )}
        {error && <div className="text-error">{error}</div>}

        {/* Botón de Google */}
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="btn-google"
        >
          <svg width="20" height="20" viewBox="0 0 48 48" className="google-icon">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuar con Google
        </button>

        <div className="divider"><span>o</span></div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" type="email" required placeholder="ejemplo@gmail.com" />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" required />
          </div>
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? "Entrando..." : "Entrar"}
          </button>

          <div className="text-center mt-1rem">
            <Link href="/register" className="bio text-underline">¿No tienes cuenta? Regístrate aquí</Link>
          </div>
        </form>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
