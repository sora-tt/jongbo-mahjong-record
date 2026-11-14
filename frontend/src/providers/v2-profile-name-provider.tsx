"use client";

import * as React from "react";

import { fetchMe } from "@/lib/api/users";

type ProfileNameContextValue = {
  profileName: string | null;
  setProfileName: (name: string) => void;
};

const ProfileNameContext = React.createContext<ProfileNameContextValue | null>(
  null
);

export const V2ProfileNameProvider = ({
  children,
  userId,
  fallbackName,
}: React.PropsWithChildren<{
  userId: string | null;
  fallbackName: string | null;
}>) => {
  const [profile, setProfile] = React.useState<{
    userId: string;
    name: string;
  } | null>(null);
  const requestVersion = React.useRef(0);

  const setProfileName = React.useCallback(
    (name: string) => {
      if (!userId) return;
      requestVersion.current += 1;
      setProfile({ userId, name });
    },
    [userId]
  );

  React.useEffect(() => {
    if (!userId) return;
    let active = true;
    const version = ++requestVersion.current;
    fetchMe()
      .then(({ name }) => {
        if (active && requestVersion.current === version) {
          setProfile({ userId, name });
        }
      })
      .catch(() => {
        // Keep the current name or the authentication profile as a fallback.
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const profileName =
    userId && profile?.userId === userId ? profile.name : fallbackName;
  const value = React.useMemo(
    () => ({ profileName, setProfileName }),
    [profileName, setProfileName]
  );

  return (
    <ProfileNameContext.Provider value={value}>
      {children}
    </ProfileNameContext.Provider>
  );
};

export const useProfileName = () => {
  const context = React.useContext(ProfileNameContext);
  if (!context) {
    throw new Error("useProfileName must be used within V2ProfileNameProvider");
  }
  return context;
};
