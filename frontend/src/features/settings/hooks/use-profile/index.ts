"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { ApiError, getApiErrorMessage } from "@/lib/api/core";
import { fetchMe, updateMe } from "@/lib/api/users";
import { useProfileName } from "@/providers/profile-name-provider";

import type { ApiUser, UpdateMeInput } from "@/lib/api/contracts";

export const useProfile = () => {
  const router = useRouter();
  const { setProfileName } = useProfileName();
  const [profile, setProfile] = React.useState<ApiUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [saveError, setSaveError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);
  const savingRef = React.useRef(false);
  const mounted = React.useRef(false);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchMe()
      .then((data) => {
        if (active) {
          setProfile(data);
          setProfileName(data.name);
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) {
          router.replace("/login");
          return;
        }
        setError(
          getApiErrorMessage(cause, "プロフィールを読み込めませんでした。")
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt, router, setProfileName]);

  const save = async (input: UpdateMeInput) => {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    try {
      const data = await updateMe(input);
      if (!mounted.current) return false;
      setProfile(data);
      setProfileName(data.name);
      return true;
    } catch (cause) {
      if (mounted.current) {
        if (cause instanceof ApiError && cause.status === 401) {
          router.replace("/login");
        } else {
          setSaveError(
            getApiErrorMessage(cause, "プロフィールを保存できませんでした。")
          );
        }
      }
      return false;
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  return {
    profile,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
    save,
    saving,
    saveError,
  };
};
