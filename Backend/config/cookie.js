// Centralized auth-cookie options. In production over HTTPS, cross-site cookies
// (frontend and backend on different Vercel domains) REQUIRE SameSite=None +
// Secure, otherwise the browser silently drops the cookie and auth breaks. In
// local dev (http://localhost) we use Lax + non-secure so it works without HTTPS.
const isProd = process.env.NODE_ENV === "production";

export const authCookieOptions = {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  sameSite: isProd ? "none" : "lax",
  secure: isProd,
};

export default authCookieOptions;
