import rateLimit from "express-rate-limit";

function rateLimitBody(code: string, message: string) {
  return { ok: false, error: { code, message } };
}

export const defaultRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitBody("RATE_LIMITED", "Too many requests — please try again later"),
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitBody("RATE_LIMITED", "Too many authentication attempts"),
});

export const otpRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitBody("RATE_LIMITED", "Too many OTP requests — wait 10 minutes"),
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitBody("RATE_LIMITED", "Upload rate limit exceeded"),
});
