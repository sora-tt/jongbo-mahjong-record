"use client";

import * as React from "react";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/v2/ui/button";
import { ButtonLink } from "@/components/v2/ui/button-link";
import { Input } from "@/components/v2/ui/input";
import { Panel } from "@/components/v2/ui/panel";
import { Status } from "@/components/v2/ui/status";

import type { ApiUser, UpdateMeInput } from "@/lib/api/contracts";

export const ProfileForm = ({
  profile,
  onSave,
  saving,
  error,
}: {
  profile: ApiUser;
  onSave: (input: UpdateMeInput) => Promise<void>;
  saving: boolean;
  error: string;
}) => {
  const [name, setName] = React.useState(profile.name);
  const [username, setUsername] = React.useState(profile.username);
  const [errors, setErrors] = React.useState({ name: "", username: "" });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const nextErrors = {
      name: trimmedName ? "" : "表示名を入力してください。",
      username: !trimmedUsername
        ? "ユーザーネームを入力してください。"
        : /^[a-zA-Z0-9_]+$/.test(trimmedUsername)
          ? ""
          : "半角英数字・アンダースコアで入力してください。",
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.username) return;
    await onSave({ name: trimmedName, username: trimmedUsername });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Panel className="space-y-5">
        <Input
          label="表示名"
          size="lg"
          value={name}
          disabled={saving}
          error={errors.name}
          onChange={(event) => {
            setName(event.target.value);
            setErrors((value) => ({ ...value, name: "" }));
          }}
        />
        <Input
          label="ユーザーネーム"
          size="lg"
          value={username}
          disabled={saving}
          description="半角英数字・アンダースコアで入力"
          error={errors.username}
          onChange={(event) => {
            setUsername(event.target.value);
            setErrors((value) => ({ ...value, username: "" }));
          }}
        />
      </Panel>
      {error && <Status message={error} />}
      <Button type="submit" size="lg" fullWidth loading={saving}>
        変更を保存
      </Button>
      {!saving && (
        <ButtonLink
          href="/v2/settings"
          variant="tertiary"
          fullWidth
          leadingIcon={<ArrowLeft size={18} />}
        >
          設定に戻る
        </ButtonLink>
      )}
    </form>
  );
};
