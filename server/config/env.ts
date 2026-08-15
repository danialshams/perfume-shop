export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  appName: process.env.APP_NAME || "Perfume Shop",
  appUrl: process.env.APP_URL || "http://localhost:3000",

  dbHost: process.env.DB_HOST || "",
  dbPort: Number(process.env.DB_PORT || 3306),
  dbName: process.env.DB_NAME || "",
  dbUser: process.env.DB_USER || "",
  dbPassword: process.env.DB_PASSWORD || "",

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1d",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
};
