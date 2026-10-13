"use client";

import * as React from "react";

import { MatchForm } from "@/features/match/ui/MatchForm";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

import { useRecordMatchPage } from "./hooks";

const NewMatchPage: React.FC = () => {
  const {
    values,
    setValues,
    constraint,
    members,
    chomboPenaltyPoints,
    allowOffTableKyotaku,
    isLoading,
    notFound,
    isSubmitting,
    error,
    ready,
    handleSubmit,
    handleBack,
  } = useRecordMatchPage();

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      {isLoading ? (
        <LoadingState
          label="対局記録画面を読み込んでいます…"
          className="min-h-[calc(100vh-4rem)]"
        />
      ) : notFound ? (
        <div className="mx-auto max-w-2xl px-4 py-8">
          <EmptyState
            title="Sessionが見つかりません"
            description="シーズン詳細に戻ってSessionを選び直してください。"
            action={
              <Button variant="secondary" onClick={handleBack}>
                シーズン詳細へ戻る
              </Button>
            }
          />
        </div>
      ) : error && !ready ? (
        <div className="mx-auto max-w-2xl px-4 py-8">
          <ErrorState message={error} />
        </div>
      ) : ready ? (
        <MatchForm
          mode="additional"
          values={values}
          constraint={constraint}
          members={members}
          chomboPenaltyPoints={chomboPenaltyPoints}
          allowOffTableKyotaku={allowOffTableKyotaku}
          error={error}
          isSubmitting={isSubmitting}
          onChange={setValues}
          onSubmit={() => void handleSubmit()}
          onBack={handleBack}
        />
      ) : null}
    </AppShell>
  );
};

export default NewMatchPage;
