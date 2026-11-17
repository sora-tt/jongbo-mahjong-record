"use client";

import * as React from "react";

import { ApiError, getApiErrorMessage } from "@/lib/api/core";

import { Button } from "@/components/v2/ui/button";
import { Dialog } from "@/components/v2/ui/dialog";

export const DeleteResourceControl = ({
  disabled = false,
  resourceName,
  description,
  uncertainMessage,
  onDelete,
  onDeleted,
  onAuthenticationError,
}: {
  disabled?: boolean;
  resourceName: string;
  description: string;
  uncertainMessage: string;
  onDelete: () => Promise<void>;
  onDeleted: () => void;
  onAuthenticationError: () => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const confirmDelete = async () => {
    if (loading) return;
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
        deleteError instanceof ApiError &&
          deleteError.status !== null &&
          deleteError.status >= 400 &&
          deleteError.status < 500
          ? getApiErrorMessage(
              deleteError,
              `${resourceName}を削除できませんでした。`
            )
          : uncertainMessage
      );
    } finally {
      setLoading(false);
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
        {resourceName}を削除
      </Button>
      <Dialog
        ref={ref}
        className="w-full"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => {
          setOpen(false);
          setError(null);
        }}
        onCancel={(event) => {
          if (loading) event.preventDefault();
        }}
      >
        <h2 id={titleId} className="text-center text-v2-heading-2 font-bold">
          {resourceName}を削除しますか？
        </h2>
        <p
          id={descriptionId}
          className="mt-3 text-v2-caption text-v2-text-secondary"
        >
          {description}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-v2-caption text-v2-danger">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={loading}
            onClick={() => ref.current?.close()}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="danger"
            fullWidth
            loading={loading}
            onClick={() => void confirmDelete()}
          >
            削除する
          </Button>
        </div>
      </Dialog>
    </>
  );
};
