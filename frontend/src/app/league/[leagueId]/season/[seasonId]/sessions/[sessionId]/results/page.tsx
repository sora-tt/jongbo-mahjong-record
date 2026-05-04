"use client";

import * as React from "react";

const SessionResultsPage: React.FC = () => {
  return (
    <div className="flex-1 bg-white min-h-screen font-jp">
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-2xl font-bold text-text-dark">本日の成績</h1>
        <p className="mt-2 text-sm text-text-muted">
          最初の対局は保存されました。結果一覧画面は次の PR で接続します。
        </p>
      </div>
    </div>
  );
};

export default SessionResultsPage;
