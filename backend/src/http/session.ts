export const SESSION_COOKIE_NAME = "jongbo_session";

const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export const getSessionMaxAgeSeconds = () => {
  const raw = process.env.SESSION_COOKIE_MAX_AGE_SECONDS;
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_SESSION_MAX_AGE_SECONDS;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SESSION_MAX_AGE_SECONDS;
  }

  return parsed;
};

export const getSessionCookieOptions = () => ({
  path: "/",
  httpOnly: true,
  sameSite: "Lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: getSessionMaxAgeSeconds(),
});
