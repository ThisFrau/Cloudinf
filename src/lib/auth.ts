import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const secretKey = "super-premium-secret-key-cloudinf";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function decrypt(token: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
        return payload;
    } catch (e) {
        return null;
    }
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function createSession(userId: string, username: string) {
    const sessionToken = await encrypt({ userId, username });
    (await cookies()).set("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 // 24 hours
    });
}

export async function destroySession() {
    (await cookies()).delete("session");
}
