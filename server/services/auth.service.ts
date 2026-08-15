import { userRepository } from "@/server/repositories/user.repository";
import { comparePassword, hashPassword } from "@/server/utils/password";
import { signAccessToken } from "@/server/utils/jwt";

export const authService = {
  async register(data: { full_name: string; email: string; password: string }) {
    const normalizedEmail = data.email.trim().toLowerCase();

    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error("Email already exists");
    }

    const password_hash = await hashPassword(data.password);

    const user = await userRepository.create({
      full_name: data.full_name.trim(),
      email: normalizedEmail,
      password_hash,
    });

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, accessToken };
  },

  async login(data: { email: string; password: string }) {
    const normalizedEmail = data.email.trim().toLowerCase();

    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (user.status !== "ACTIVE" || Number(user.is_active) !== 1) {
      throw new Error("Your account is inactive");
    }

    const valid = await comparePassword(data.password, user.password_hash);

    if (!valid) {
      throw new Error("Invalid credentials");
    }

    await userRepository.updateLastLoginAt(user.id);

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    };
  },

  async me(userId: number) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.status !== "ACTIVE" || Number(user.is_active) !== 1) {
      throw new Error("User is inactive");
    }

    return user;
  },
};
