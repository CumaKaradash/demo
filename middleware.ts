import { auth } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Extract subdomain: e.g., drahmet.psikolojiplatform.com or drahmet.localhost:3000
  const currentHost = hostname.replace(`.localhost:${process.env.PORT || 3000}`, "").replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, "");

  // If the hostname is different from the current host, we have a subdomain
  const isSubdomain = currentHost !== hostname && currentHost !== "www" && currentHost !== "localhost" && !currentHost.includes("localhost");

  // Handle subdomain routing - rewrite to /booking/[subdomain]
  if (isSubdomain && !pathname.startsWith("/admin-paneli") && !pathname.startsWith("/login") && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
    const url = req.nextUrl.clone();
    url.pathname = `/booking/${currentHost}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Check if the route is an admin route
  const isAdminRoute = pathname.startsWith("/admin-paneli");

  // Check if user is authenticated
  const isAuthenticated = !!req.auth;

  // If accessing admin routes without authentication, redirect to login
  if (isAdminRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login page, redirect to admin panel
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin-paneli", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
