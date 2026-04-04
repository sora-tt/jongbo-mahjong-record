import { ValidationError } from "@/errors.js";
import type { UserRepository } from "@/domain/repositories/userRepository.js";

const normalizeUsername = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  getMe(userId: string) {
    return this.userRepository.get(userId);
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

  async updateMe(input: {
    userId: string;
    name?: string;
    username?: string;
  }) {
    const patch = {
      userId: input.userId,
      name: input.name?.trim(),
      username: input.username ? normalizeUsername(input.username) : undefined,
    };

    return this.userRepository.updateProfile(patch);
  }
}
