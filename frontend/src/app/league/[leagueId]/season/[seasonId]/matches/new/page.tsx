"use client";

import Header from "@/components/common/container/header";

const NewMatchPage = () => {
  return (
    <div className="flex-1 bg-white min-h-screen font-jp">
      <Header />
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">対局記録</h1>
          <p className="mt-2 text-sm text-text-muted">
            次の PR で点数入力画面を実装します。
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewMatchPage;
