import { NotFoundError, ValidationError } from "@/domain/shared/errors.js";
import type { UserRepository } from "@/domain/user/repository.js";

const normalizeUsername = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");

const getFallbackName = (email: string | null, name: string | null) =>
  name?.trim() || email?.split("@")[0]?.trim() || "user";

const getFallbackUsername = (email: string | null, name: string | null) =>
  normalizeUsername(email?.split("@")[0] ?? name ?? "user") || "user";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async getMe(input: {
    userId: string;
    email: string | null;
    name: string | null;
  }) {
    try {
      return await this.userRepository.get(input.userId);
    } catch (error) {
      if (!(error instanceof NotFoundError)) {
        throw error;
      }

      return this.userRepository.upsertProfile({
        userId: input.userId,
        email: input.email,
        name: getFallbackName(input.email, input.name),
        username: getFallbackUsername(input.email, input.name),
      });
    }
  }

  async createMe(input: {
    userId: string;
    email: string | null;
    name: string;
    username: string;
  }) {
    const name = input.name.trim();
    if (!name) {
      throw new ValidationError("name is required");
    }

    const username = normalizeUsername(input.username);
    if (!username) {
      throw new ValidationError("username is required");
    }

    return this.userRepository.upsertProfile({
      userId: input.userId,
      email: input.email,
      name,
      username,
    });
  }

  async updateMe(input: { userId: string; name?: string; username?: string }) {
    const patch = {
      userId: input.userId,
      name: input.name?.trim(),
      username: input.username ? normalizeUsername(input.username) : undefined,
    };

    return this.userRepository.updateProfile(patch);
  }
}
