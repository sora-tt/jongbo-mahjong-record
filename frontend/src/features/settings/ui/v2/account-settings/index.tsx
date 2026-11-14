import * as React from "react";

import { ChevronRight } from "lucide-react";

import { Button } from "@/components/v2/ui/button";
import { Panel } from "@/components/v2/ui/panel";

export const AccountSettings = ({ email }: { email: string }) => (
  <section>
    <h2 className="mb-3 font-bold">アカウント</h2>
    <Panel className="!py-0">
      <Button
        type="button"
        variant="tertiary"
        disabled
        className="!h-auto !w-full !justify-between !rounded-none !border-0 !border-b !border-v2-border !px-0 !py-4 !text-left !font-normal !text-v2-text disabled:!opacity-100"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">
            メールアドレス
            <span className="text-v2-text-secondary">（未実装）</span>
          </span>
          <span className="block truncate text-v2-caption text-v2-text-secondary">
            {email}
          </span>
        </span>
        <ChevronRight
          size={20}
          className="text-v2-text-secondary"
          aria-hidden="true"
        />
      </Button>
      <Button
        type="button"
        variant="tertiary"
        disabled
        className="!h-auto !w-full !justify-between !rounded-none !border-0 !px-0 !py-4 !text-left !font-normal !text-v2-text disabled:!opacity-100"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">
            パスワード<span className="text-v2-text-secondary">（未実装）</span>
          </span>
          <span className="block text-v2-caption text-v2-text-secondary">
            パスワードの変更
          </span>
        </span>
        <ChevronRight
          size={20}
          className="text-v2-text-secondary"
          aria-hidden="true"
        />
      </Button>
    </Panel>
  </section>
);
