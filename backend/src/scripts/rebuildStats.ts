import { pathToFileURL } from "node:url";
import { StatsRebuilder } from "@/application/services/statsRebuilder.js";
import type {
  RebuildAllReport,
  RebuildReport,
} from "@/application/services/statsRebuilder.js";
import { createDependencies } from "@/presentation/dependencies.js";

export type StatsRebuildCommand =
  | { scopeType: "all" }
  | {
      scopeType: "session";
      leagueId: string;
      seasonId: string;
      sessionId: string;
    }
  | { scopeType: "season"; leagueId: string; seasonId: string }
  | { scopeType: "league"; leagueId: string }
  | { scopeType: "overall" };

const usage =
  "usage: pnpm repair:stats -- <all | session leagueId seasonId sessionId | season leagueId seasonId | league leagueId | overall>";

export const parseStatsRebuildArgs = (
  rawArgs: string[],
): StatsRebuildCommand => {
  const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
  const [scopeType, leagueId, seasonId, sessionId] = args;

  if (scopeType === "all" && args.length === 1) {
    return { scopeType: "all" };
  }
  if (
    scopeType === "session" &&
    leagueId &&
    seasonId &&
    sessionId &&
    args.length === 4
  ) {
    return { scopeType, leagueId, seasonId, sessionId };
  }
  if (scopeType === "season" && leagueId && seasonId && args.length === 3) {
    return { scopeType, leagueId, seasonId };
  }
  if (scopeType === "league" && leagueId && args.length === 2) {
    return { scopeType, leagueId };
  }
  if (scopeType === "overall" && args.length === 1) {
    return { scopeType: "overall" };
  }
  throw new Error(usage);
};

export const executeStatsRebuildCommand = async (
  statsRebuilder: Pick<
    StatsRebuilder,
    | "rebuildAll"
    | "rebuildSession"
    | "rebuildSeason"
    | "rebuildLeague"
    | "rebuildOverall"
  >,
  command: StatsRebuildCommand,
): Promise<RebuildReport | RebuildAllReport> => {
  if (command.scopeType === "all") return statsRebuilder.rebuildAll();
  if (command.scopeType === "session") {
    return statsRebuilder.rebuildSession(
      command.leagueId,
      command.seasonId,
      command.sessionId,
    );
  }
  if (command.scopeType === "season") {
    return statsRebuilder.rebuildSeason(command.leagueId, command.seasonId);
  }
  if (command.scopeType === "league") {
    return statsRebuilder.rebuildLeague(command.leagueId);
  }
  return statsRebuilder.rebuildOverall();
};

const main = async () => {
  const { statsRebuilder } = createDependencies();
  const command = parseStatsRebuildArgs(process.argv.slice(2));
  const report = await executeStatsRebuildCommand(statsRebuilder, command);
  console.log(JSON.stringify(report));
};

const scriptPath = process.argv[1];
if (scriptPath && import.meta.url === pathToFileURL(scriptPath).href) {
  await main();
}
