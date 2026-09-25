"use client";

import * as React from "react";

import { MatchForm } from "@/features/match/ui/MatchForm";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

import { useEditMatchPage } from "./hooks";

const EditMatchPage: React.FC = () => {
  const {
    values,
    setValues,
    constraint,
    members,
    isLoading,
    isSubmitting,
    error,
    retry,
    handleSubmit,
    handleBack,
  } = useEditMatchPage();

  return (
    <AppShell mainClassName="min-h-screen bg-background font-jp">
      {isLoading ? (
        <LoadingState
          label="対局編集画面を読み込んでいます…"
          className="min-h-[calc(100vh-4rem)]"
        />
      ) : error && !values ? (
        <div className="mx-auto max-w-2xl px-4 py-8">
          <ErrorState message={error} onRetry={retry} />
          <Button variant="secondary" className="mt-4" onClick={retry}>
            再読み込み
          </Button>
        </div>
      ) : values ? (
        <MatchForm
          mode="edit"
          values={values}
          constraint={constraint}
          members={members}
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

export default EditMatchPage;
