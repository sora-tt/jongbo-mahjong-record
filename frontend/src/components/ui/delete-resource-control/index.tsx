"use client";

import * as React from "react";

import { ApiError, getApiErrorMessage } from "@/lib/api/core";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export const DeleteResourceControl = ({
  disabled = false,
  resourceName,
  buttonLabel,
  description,
  details,
  uncertainMessage,
  onDelete,
  onVerify,
  onDeleted,
  onAuthenticationError,
}: {
  disabled?: boolean;
  resourceName: string;
  buttonLabel?: string;
  description: string;
  details?: React.ReactNode;
  uncertainMessage: string;
  onDelete: () => Promise<void>;
  onVerify: () => Promise<unknown>;
  onDeleted: () => void;
  onAuthenticationError: () => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [verificationNeeded, setVerificationNeeded] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const inFlight = React.useRef(false);
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const verifyDeletion = async () => {
    setVerifying(true);
    try {
      await onVerify();
      setVerificationNeeded(false);
      setError(
        "削除は完了していません。内容を確認してから再度お試しください。"
      );
    } catch (verifyError) {
      if (verifyError instanceof ApiError && verifyError.status === 404) {
        setVerificationNeeded(false);
        onDeleted();
      } else if (
        verifyError instanceof ApiError &&
        verifyError.status === 401
      ) {
        onAuthenticationError();
      } else {
        setError(uncertainMessage);
      }
    } finally {
      setVerifying(false);
    }
  };

  const retryVerification = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await verifyDeletion();
    } finally {
      inFlight.current = false;
    }
  };

  const confirmDelete = async () => {
    if (inFlight.current || verificationNeeded) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      await onDelete();
      onDeleted();
    } catch (deleteError) {
      if (deleteError instanceof ApiError && deleteError.status === 401) {
        onAuthenticationError();
        return;
      }
      setError(
        getApiErrorMessage(
          deleteError,
          `${resourceName}を削除できませんでした。`
        )
      );
      setVerificationNeeded(true);
      await verifyDeletion();
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size="lg"
        fullWidth
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {buttonLabel ?? `${resourceName}を削除`}
      </Button>
      <Dialog
        ref={ref}
        className="w-full"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => {
          setOpen(false);
          if (!verificationNeeded) setError(null);
        }}
        onCancel={(event) => {
          if (loading || verifying) event.preventDefault();
        }}
      >
        <h2 id={titleId} className="text-center text-app-heading-2 font-bold">
          {resourceName}を削除しますか？
        </h2>
        <p
          id={descriptionId}
          className="mt-3 text-app-caption text-app-text-secondary"
        >
          {description}
        </p>
        {details}
        {error && (
          <p role="alert" className="mt-3 text-app-caption text-app-danger">
            {error}
          </p>
        )}
        {verificationNeeded && (
          <Button
            type="button"
            variant="secondary"
            fullWidth
            className="mt-4"
            loading={verifying}
            disabled={loading}
            onClick={() => void retryVerification()}
          >
            状態を再確認
          </Button>
        )}
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={loading || verifying}
            onClick={() => ref.current?.close()}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="danger"
            fullWidth
            loading={loading}
            disabled={verificationNeeded || verifying}
            onClick={() => void confirmDelete()}
          >
            削除する
          </Button>
        </div>
      </Dialog>
    </>
  );
};
