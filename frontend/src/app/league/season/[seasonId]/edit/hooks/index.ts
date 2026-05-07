import { useCallback, useMemo, useState, type ChangeEvent } from "react";

import { useParams } from "next/navigation";

import { leaguesData } from "@/mocks/league";
import { convertLeagueMemberToLeagueSeasonMember } from "@/types/domain/league-converter";

import type {
  LeagueMember,
  LeagueSeasonIdType,
  LeagueSeasonMember,
} from "@/types/domain/league";
import type { UserIdType } from "@/types/domain/user";

export const useSeasonEdit = () => {
  const params = useParams();
  const seasonId = params.seasonId as LeagueSeasonIdType;

  const foundLeague = Object.values(leaguesData).find(
    (league) => league.seasons != null && seasonId in league.seasons
  );

  const leagueMembers = useMemo<Record<UserIdType, LeagueMember>>(
    () => foundLeague?.members ?? {},
    [foundLeague]
  );

  const [seasonName, setSeasonName] = useState<string>(
    () => foundLeague?.seasons?.[seasonId]?.name ?? ""
  );
  const [selectedMembers, setSelectedMembers] = useState<
    Record<UserIdType, LeagueSeasonMember>
  >(() => foundLeague?.seasons?.[seasonId]?.members ?? {});

  const handleSeasonNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSeasonName(e.target.value);
    },
    []
  );

  const handleMemberToggle = useCallback(
    (memberId: UserIdType) => {
      setSelectedMembers((prev) => {
        const exists = memberId in prev;
        const next: Record<UserIdType, LeagueSeasonMember> = { ...prev };

        if (exists) {
          delete next[memberId];
          return next;
        }

        const base = leagueMembers[memberId];
        if (!base) return prev;

        next[memberId] = convertLeagueMemberToLeagueSeasonMember(base);
        return next;
      });
    },
    [leagueMembers]
  );

  const handleSubmit = useCallback(() => {
    // TODO: PATCH /api/leagues/:leagueId/seasons/:seasonId
    const membersArray = Object.values(selectedMembers);
    console.log({ seasonName, membersArray });
  }, [seasonName, selectedMembers]);

  return {
    leagueId: foundLeague?.leagueId ?? null,
    seasonId,
    leagueMembers,
    selectedMembers,
    seasonName,
    handleMemberToggle,
    handleSeasonNameChange,
    handleSubmit,
  };
};
