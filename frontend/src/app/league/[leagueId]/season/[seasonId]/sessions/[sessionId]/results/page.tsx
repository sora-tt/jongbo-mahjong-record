"use client";

import * as React from "react";

import { Calendar, BookOpen } from "lucide-react";

import Header from "@/components/common/container/header";
import { DailyRecordTable } from "@/components/pages/daily-record/daily-record-table";
import { Button } from "@/components/ui/button";
import { HeaderCard } from "@/components/ui/header-card";
import { SectionCard } from "@/components/ui/section-card";

import { useSessionResultsPage } from "./hooks";

const SessionResultsPage: React.FC = () => {
  const {
    date,
    rule,
    players,
    matches,
    totals,
    isLoading,
    isEnding,
    deletingMatchId,
    deleteTargetMatchId,
    error,
    handleAddRecord,
    handleEditMatch,
    handleEndRecord,
    handleRequestDeleteMatch,
    handleCancelDeleteMatch,
    handleConfirmDeleteMatch,
  } = useSessionResultsPage();

  return (
    <div className="flex-1 bg-white min-h-screen font-jp">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-6">
          <HeaderCard title="本日の成績">
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} className="text-white" />
              <span>{date || "読み込み中"}</span>
            </span>

            {rule && (
              <span className="inline-flex items-center gap-1">
                <BookOpen size={14} className="text-white" />
                <span>{rule}</span>
              </span>
            )}
          </HeaderCard>
        </section>

        {error && (
          <section className="mb-6">
            <div className="bg-error-bg border-2 border-error-border rounded-lg p-4">
              <p className="text-error-text text-sm">{error}</p>
            </div>
          </section>
        )}

        <section className="mb-10">
          <SectionCard title="成績表" bodyClassName="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="px-4 py-10 text-center text-sm text-text-muted">
                本日の成績を読み込んでいます...
              </div>
            ) : (
              <DailyRecordTable
                players={players}
                matches={matches}
                totals={totals}
                deletingMatchId={deletingMatchId}
                onEditMatch={handleEditMatch}
                onDeleteMatch={handleRequestDeleteMatch}
              />
            )}
          </SectionCard>
        </section>

        <section className="mb-6">
          <div className="flex flex-col items-center gap-3">
            <Button
              variant="brand-secondary"
              className="w-40 flex-none"
              onClick={handleAddRecord}
              disabled={isLoading}
            >
              記録を追加
            </Button>
            <Button
              className="w-40 flex-none"
              onClick={handleEndRecord}
              disabled={isLoading || isEnding}
            >
              {isEnding ? "終了中..." : "記録を終了"}
            </Button>
          </div>
        </section>
      </div>

      {deleteTargetMatchId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-match-title"
        >
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h2
              id="delete-match-title"
              className="text-lg font-bold text-text-dark"
            >
              対局結果を削除しますか？
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              削除した対局結果は元に戻せません。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="brand-secondary"
                onClick={handleCancelDeleteMatch}
                disabled={Boolean(deletingMatchId)}
              >
                キャンセル
              </Button>
              <Button
                onClick={() => handleConfirmDeleteMatch(deleteTargetMatchId)}
                disabled={Boolean(deletingMatchId)}
              >
                {deletingMatchId ? "削除中..." : "削除する"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionResultsPage;
