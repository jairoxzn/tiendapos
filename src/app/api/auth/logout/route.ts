import { NextResponse } from "next/server";

import { destroySessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  await destroySessionCookie();
  const url = new URL("/login", req.url);
  return NextResponse.redirect(url, { status: 303 });
}
