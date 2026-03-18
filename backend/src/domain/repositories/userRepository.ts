import type { JoiningSeason, User } from "@/domain/models.js";

export interface UserRepository {
  get(userId: string): Promise<User>;
  getByIds(userIds: string[]): Promise<User[]>;
  search(query: string): Promise<User[]>;
  listJoiningSeasons(userId: string): Promise<JoiningSeason[]>;
  upsertProfile(input: {
    userId: string;
    email: string | null;
    name: string;
    username: string;
  }): Promise<User>;
  updateProfile(input: {
    userId: string;
    name?: string;
    username?: string;
  }): Promise<User>;
}
