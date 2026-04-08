import { useCallback, useState, type ChangeEvent } from "react";

import { leagueData1 } from "@/mocks/league";
import { convertLeagueMemberToLeagueSeasonMember } from "@/types/domain/league-converter";

import type { LeagueMember, LeagueSeasonMember } from "@/types/domain/league";
import type { UserIdType } from "@/types/domain/user";

export const useSeasonEdit = () => {
  const leagueMembers: Record<UserIdType, LeagueMember> = leagueData1.members;

  const currentSeason = Object.values(leagueData1.seasons)[0];

  const [seasonName, setSeasonName] = useState<string>(
    () => currentSeason?.name ?? ""
  );
  const [selectedMembers, setSelectedMembers] = useState<
    Record<UserIdType, LeagueSeasonMember>
  >(() => currentSeason?.members ?? {});

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
    leagueMembers,
    selectedMembers,
    seasonName,
    handleMemberToggle,
    handleSeasonNameChange,
    handleSubmit,
  };
};
