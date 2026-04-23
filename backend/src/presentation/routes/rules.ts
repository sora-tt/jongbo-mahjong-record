import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AppBindings } from "@/presentation/bindings.js";
import { ok } from "@/presentation/response.js";
import {
  createRuleSchema,
  updateRuleSchema,
} from "@/presentation/schemas/rule.js";
import type { Services } from "@/presentation/dependencies.js";

export const buildRulesRouter = (services: Services) =>
  new Hono<AppBindings>()
    .get("/", async (c) => ok(c, await services.ruleService.listRules()))
    .get("/:ruleId", async (c) =>
      ok(c, await services.ruleService.getRule(c.req.param("ruleId"))),
    )
    .post("/", zValidator("json", createRuleSchema), async (c) => {
      const input = c.req.valid("json");
      return ok(c, await services.ruleService.createRule(input), 201);
    })
    .patch("/:ruleId", zValidator("json", updateRuleSchema), async (c) => {
      const input = c.req.valid("json");
      return ok(
        c,
        await services.ruleService.updateRule(c.req.param("ruleId"), input),
      );
    })
    .delete("/:ruleId", async (c) => {
      await services.ruleService.deleteRule(c.req.param("ruleId"));
      return c.body(null, 204);
    });
