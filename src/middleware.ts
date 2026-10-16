import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/session-token";

/**
 * Protezione delle aree riservate.
 * Qui si verifica solo la firma del cookie (edge runtime, senza DB):
 * la validità completa (utente esistente, sessione non revocata) è controllata
 * dalle server action tramite getSession().
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/medico")) {
    if (session?.role !== "medico") return redirectTo(req, "/login/medico", !session);
  } else if (pathname.startsWith("/paziente")) {
    if (session?.role !== "paziente") return redirectTo(req, "/login/paziente", !session);
  }

  return NextResponse.next();
}

function redirectTo(req: NextRequest, path: string, clearCookie: boolean) {
  const url = req.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  const res = NextResponse.redirect(url);
  // Cookie presente ma non valido/scaduto: lo rimuoviamo
  if (clearCookie && req.cookies.get(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE);
  return res;
}

export const config = {
  matcher: ["/medico/:path*", "/paziente/:path*"],
};
