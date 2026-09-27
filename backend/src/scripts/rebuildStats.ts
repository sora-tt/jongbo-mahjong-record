import { createDependencies } from "@/presentation/dependencies.js";

const rawArgs = process.argv.slice(2);
const [scopeType, leagueId, seasonId, sessionId] =
  rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;

const main = async () => {
  const { statsRebuilder } = createDependencies();
  let report;

  if (scopeType === "session" && leagueId && seasonId && sessionId) {
    report = await statsRebuilder.rebuildSession(leagueId, seasonId, sessionId);
  } else if (scopeType === "season" && leagueId && seasonId) {
    report = await statsRebuilder.rebuildSeason(leagueId, seasonId);
  } else if (scopeType === "league" && leagueId) {
    report = await statsRebuilder.rebuildLeague(leagueId);
  } else if (scopeType === "overall" && !leagueId) {
    report = await statsRebuilder.rebuildOverall();
  } else {
    throw new Error(
      "usage: pnpm repair:stats -- <session leagueId seasonId sessionId | season leagueId seasonId | league leagueId | overall>",
    );
  }

  console.log(JSON.stringify(report));
};

await main();
