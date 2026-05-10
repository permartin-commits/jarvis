import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const user = process.env.AUTH_USER;
  const pass = process.env.AUTH_PASS;

  if (!user || !pass) {
    console.error("AUTH_USER og/eller AUTH_PASS er ikke satt i miljøvariablene.");
    return new NextResponse("Server-konfigurasjonsfeil", { status: 500 });
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const colonIndex = decoded.indexOf(":");
      if (colonIndex !== -1) {
        const inputUser = decoded.slice(0, colonIndex);
        const inputPass = decoded.slice(colonIndex + 1);
        if (inputUser === user && inputPass === pass) {
          return NextResponse.next();
        }
      }
    }
  }

  return new NextResponse("Tilgang nektet", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Jarvis Dashboard", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: [
    /*
     * Matcher: alle ruter unntatt Next.js interne ruter og statiske filer.
     * Dette beskytter /, /portefolje, /prosjekter, /ai-logger og alle
     * sub-ruter, men lar _next/static, _next/image og favicon.ico gjennom
     * uten autentisering (nødvendig for at nettleseren skal vise login-dialogen).
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
