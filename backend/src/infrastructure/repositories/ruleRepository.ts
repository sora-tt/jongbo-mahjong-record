import { Timestamp, type Firestore } from "firebase-admin/firestore";
import type { Rule } from "@/domain/models.js";
import type { RuleRepository } from "@/domain/repositories/ruleRepository.js";
import { NotFoundError } from "@/errors.js";
import { toIsoString } from "@/infrastructure/firestore/utils.js";

export class FirestoreRuleRepository implements RuleRepository {
  constructor(private readonly db: Firestore) {}

  async list(): Promise<Rule[]> {
    const snapshot = await this.db
      .collection("rules")
      .orderBy("created_at", "asc")
      .get();
    return snapshot.docs.map((doc) => this.map(doc.id, doc.data()));
  }

  async get(ruleId: string): Promise<Rule> {
    const snapshot = await this.db.collection("rules").doc(ruleId).get();
    if (!snapshot.exists) {
      throw new NotFoundError("rule not found", { ruleId });
    }

    return this.map(snapshot.id, snapshot.data() ?? {});
  }

  async create(input: {
    name: string;
    description: string;
    gameType: Rule["gameType"];
    uma: Rule["uma"];
    oka: Rule["oka"];
    scoreCalculation: Rule["scoreCalculation"];
  }): Promise<Rule> {
    const ref = this.db.collection("rules").doc();
    const now = Timestamp.now();
    await ref.set({
      id: ref.id,
      name: input.name,
      description: input.description,
      game_type: input.gameType,
      uma: {
        first: input.uma.first,
        second: input.uma.second,
        third: input.uma.third,
        fourth: input.uma.fourth,
      },
      oka: {
        starting_points: input.oka.startingPoints,
        return_points: input.oka.returnPoints,
      },
      score_calculation: input.scoreCalculation,
      created_at: now,
      updated_at: now,
    });

    return this.get(ref.id);
  }

  async update(
    ruleId: string,
    input: Partial<{
      name: string;
      description: string;
      gameType: Rule["gameType"];
      uma: Rule["uma"];
      oka: Rule["oka"];
      scoreCalculation: Rule["scoreCalculation"];
    }>,
  ): Promise<Rule> {
    const ref = this.db.collection("rules").doc(ruleId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new NotFoundError("rule not found", { ruleId });
    }

    const patch: Record<string, unknown> = {
      updated_at: Timestamp.now(),
    };
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.gameType !== undefined) patch.game_type = input.gameType;
    if (input.uma !== undefined) {
      patch.uma = {
        first: input.uma.first,
        second: input.uma.second,
        third: input.uma.third,
        fourth: input.uma.fourth,
      };
    }
    if (input.oka !== undefined) {
      patch.oka = {
        starting_points: input.oka.startingPoints,
        return_points: input.oka.returnPoints,
      };
    }
    if (input.scoreCalculation !== undefined)
      patch.score_calculation = input.scoreCalculation;

    await ref.update(patch);
    return this.get(ruleId);
  }

  async delete(ruleId: string) {
    const ref = this.db.collection("rules").doc(ruleId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      throw new NotFoundError("rule not found", { ruleId });
    }
    await ref.delete();
  }

  private map(id: string, data: FirebaseFirestore.DocumentData): Rule {
    return {
      id,
      name: String(data.name ?? ""),
      description: String(data.description ?? ""),
      gameType: data.game_type,
      uma: {
        first: Number(data.uma?.first ?? 0),
        second: Number(data.uma?.second ?? 0),
        third: Number(data.uma?.third ?? 0),
        fourth: data.uma?.fourth ?? null,
      },
      oka: {
        startingPoints: Number(data.oka?.starting_points ?? 0),
        returnPoints: Number(data.oka?.return_points ?? 0),
      },
      scoreCalculation: data.score_calculation,
      createdAt: toIsoString(data.created_at),
      updatedAt: toIsoString(data.updated_at),
    };
  }
}
