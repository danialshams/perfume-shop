export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  appName: process.env.APP_NAME || "Perfume Shop",
  appUrl: process.env.APP_URL || "http://localhost:3000",

  // Use a single standard PostgreSQL URL on Vercel and on the future Node.js host.
  databaseUrl: process.env.DATABASE_URL || "",

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1d",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
};
