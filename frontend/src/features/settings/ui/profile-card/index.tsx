import { ChevronRight, User } from "lucide-react";

import Link from "next/link";

import { Card } from "@/components/ui/card";
import { IconContainer } from "@/components/ui/icon-container";

import type { ApiUser } from "@/lib/api/contracts";

export const ProfileCard = ({ profile }: { profile: ApiUser }) => (
  <Link
    href="/settings/profile"
    className="block"
    aria-label="プロフィールを編集"
  >
    <Card size="auto" className="flex items-center gap-4">
      <IconContainer size="lg" circle>
        <User size={24} />
      </IconContainer>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{profile.name}</span>
        <span className="block truncate text-app-label text-app-text-secondary">
          @{profile.username}
        </span>
      </span>
      <ChevronRight
        size={20}
        className="text-app-text-secondary"
        aria-hidden="true"
      />
    </Card>
  </Link>
);
