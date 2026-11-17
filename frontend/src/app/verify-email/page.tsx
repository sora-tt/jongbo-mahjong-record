"use client";

import * as React from "react";

import { useSearchParams } from "next/navigation";

import { EmailVerification } from "@/features/auth/ui/email-verification";

import { PageLoading } from "@/components/ui/page-loading";

const VerificationContent = () => {
  const searchParams = useSearchParams();
  return <EmailVerification search={searchParams.toString()} />;
};

const VerifyEmailPage = () => (
  <React.Suspense fallback={<PageLoading label="認証を確認しています…" />}>
    <VerificationContent />
  </React.Suspense>
);

export default VerifyEmailPage;
