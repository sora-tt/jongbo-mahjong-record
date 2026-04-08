import { Hono } from "hono";
import type { createDependencies } from "@/app/dependencies.js";
import type { AppBindings } from "@/http/bindings.js";
import { ValidationError } from "@/errors.js";
import { ok } from "@/http/response.js";
import {
  ensureNumber,
  ensureObject,
  ensureOptionalString,
  ensureString,
} from "@/http/validation.js";

type Services = ReturnType<typeof createDependencies>["services"];

const parseRuleInput = (body: Record<string, unknown>) => {
  const gameType = ensureString(body.gameType, "gameType");
  if (!["sanma", "yonma"].includes(gameType)) {
    throw new ValidationError("gameType must be sanma or yonma");
  }

  const scoreCalculation = ensureString(
    body.scoreCalculation,
    "scoreCalculation",
  );
  if (
    !["decimal", "fiveDropSixUp", "round", "floor", "ceil"].includes(
      scoreCalculation,
    )
  ) {
    throw new ValidationError("scoreCalculation is invalid");
  }

  const uma = ensureObject(body.uma, "uma");
  const oka = ensureObject(body.oka, "oka");

  return {
    name: ensureString(body.name, "name"),
    description: ensureOptionalString(body.description, "description"),
    gameType: gameType as "sanma" | "yonma",
    uma: {
      first: ensureNumber(uma.first, "uma.first"),
      second: ensureNumber(uma.second, "uma.second"),
      third: ensureNumber(uma.third, "uma.third"),
      fourth:
        uma.fourth === null || uma.fourth === undefined
          ? null
          : ensureNumber(uma.fourth, "uma.fourth"),
    },
    oka: {
      startingPoints: ensureNumber(oka.startingPoints, "oka.startingPoints"),
      returnPoints: ensureNumber(oka.returnPoints, "oka.returnPoints"),
    },
    scoreCalculation: scoreCalculation as
      | "decimal"
      | "fiveDropSixUp"
      | "round"
      | "floor"
      | "ceil",
  };
};

export const buildRulesRouter = (services: Services) => {
  const app = new Hono<AppBindings>();

  app.get("/", async (c) => ok(c, await services.ruleService.listRules()));
  app.get("/:ruleId", async (c) =>
    ok(c, await services.ruleService.getRule(c.req.param("ruleId"))),
  );
  app.post("/", async (c) => {
    const body = ensureObject(await c.req.json(), "body");
    return ok(
      c,
      await services.ruleService.createRule(parseRuleInput(body)),
      201,
    );
  });
  app.patch("/:ruleId", async (c) => {
    const body = ensureObject(await c.req.json(), "body");
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = ensureString(body.name, "name");
    if (body.description !== undefined)
      patch.description = ensureString(body.description, "description");
    if (body.gameType !== undefined)
      patch.gameType = ensureString(body.gameType, "gameType");
    if (body.scoreCalculation !== undefined)
      patch.scoreCalculation = ensureString(
        body.scoreCalculation,
        "scoreCalculation",
      );
    if (body.uma !== undefined) {
      const uma = ensureObject(body.uma, "uma");
      patch.uma = {
        first: ensureNumber(uma.first, "uma.first"),
        second: ensureNumber(uma.second, "uma.second"),
        third: ensureNumber(uma.third, "uma.third"),
        fourth:
          uma.fourth === null || uma.fourth === undefined
            ? null
            : ensureNumber(uma.fourth, "uma.fourth"),
      };
    }
    if (body.oka !== undefined) {
      const oka = ensureObject(body.oka, "oka");
      patch.oka = {
        startingPoints: ensureNumber(oka.startingPoints, "oka.startingPoints"),
        returnPoints: ensureNumber(oka.returnPoints, "oka.returnPoints"),
      };
    }
    return ok(
      c,
      await services.ruleService.updateRule(c.req.param("ruleId"), patch),
    );
  });
  app.delete("/:ruleId", async (c) => {
    await services.ruleService.deleteRule(c.req.param("ruleId"));
    return c.body(null, 204);
  });

  return app;
};
