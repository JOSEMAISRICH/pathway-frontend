import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.next();
  }

  const token = request.cookies.get("pw_session")?.value;
  const signIn = new URL("/sign-in", request.url);

  if (!token) {
    return NextResponse.redirect(signIn);
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
  } catch {
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
