import * as React from "react";

import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api/core";
import { fetchLeagues } from "@/lib/api/leagues";
import { fetchMe } from "@/lib/api/users";

const DEFAULT_ERROR_MESSAGE =
  "ホーム画面の取得に失敗しました。時間をおいて再度お試しください。";

export const useHome = () => {
  const router = useRouter();
  const [userId, setUserId] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const [leagues, setLeagues] = React.useState<
    Awaited<ReturnType<typeof fetchLeagues>>
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [me, joinedLeagues] = await Promise.all([
          fetchMe(),
          fetchLeagues(),
        ]);

        if (!isActive) {
          return;
        }

        setUserId(me.id);
        setUserName(me.name);
        setLeagues(joinedLeagues);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/login");
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : DEFAULT_ERROR_MESSAGE
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [router]);

  const hasLeagues = leagues.length > 0;

  return {
    userId,
    userName,
    leagues,
    hasLeagues,
    isLoading,
    error,
  };
};
