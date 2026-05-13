import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "tiendapos_session";
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-only-secret-change-me",
);

const PUBLIC_PATHS = ["/login", "/api/health", "/catalogo"];
const ADMIN_ONLY_PATHS = ["/users", "/reports"];

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth") ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return redirectToLogin(req);

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const role = payload.role as string | undefined;

    if (
      ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch {
    return redirectToLogin(req);
  }
}

function redirectToLogin(req: NextRequest) {
  const url = new URL("/login", req.url);
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
