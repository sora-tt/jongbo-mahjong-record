"use client";

import * as React from "react";

import { MatchForm } from "@/features/match/ui/MatchForm";

import { AppShell } from "@/components/layout/app-shell";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

import { useRecordMatchPage } from "./hooks";

const NewMatchPage: React.FC = () => {
  const {
    values,
    setValues,
    constraint,
    members,
    isLoading,
    isSubmitting,
    error,
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
      ) : error && members.length === 0 ? (
        <div className="mx-auto max-w-2xl px-4 py-8">
          <ErrorState message={error} />
        </div>
      ) : (
        <MatchForm
          mode="initial"
          values={values}
          constraint={constraint}
          members={members}
          error={error}
          isSubmitting={isSubmitting}
          onChange={setValues}
          onSubmit={() => void handleSubmit()}
          onBack={handleBack}
        />
      )}
    </AppShell>
  );
};

export default NewMatchPage;
