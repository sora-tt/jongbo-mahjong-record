export type VerificationAction = {
  mode: string;
  oobCode: string | null;
};

export const getAuthRedirectTarget = (emailVerified: boolean) =>
  emailVerified ? "/" : "/verify-email";

export const getVerificationAction = (search: string): VerificationAction => {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );

  return {
    mode: params.get("mode") ?? "",
    oobCode: params.get("oobCode") ?? null,
  };
};

export const getRetryMessage = (seconds: number) =>
  `${Math.max(0, seconds)}秒後に再送信できます`;
