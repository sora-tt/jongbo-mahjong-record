import * as React from "react";

import { Button } from "@/components/v2/ui/button";
import { Dialog } from "@/components/v2/ui/dialog";

export const DeleteMatchDialog = ({
  open,
  loading,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const ref = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <Dialog
      ref={ref}
      onClose={onCancel}
      onCancel={(event) => {
        if (loading) event.preventDefault();
      }}
      aria-labelledby="delete-match-title"
      className="w-full"
    >
      <h2
        id="delete-match-title"
        className="text-center text-v2-heading-2 font-bold"
      >
        対局結果を削除しますか？
      </h2>
      <p className="mt-3 text-center text-v2-caption text-v2-text-secondary">
        この操作は取り消せません。
      </p>
      {error && (
        <p role="alert" className="mt-3 text-v2-caption text-v2-danger">
          {error}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button
          variant="secondary"
          fullWidth
          onClick={onCancel}
          disabled={loading}
        >
          キャンセル
        </Button>
        <Button
          variant="danger"
          fullWidth
          onClick={onConfirm}
          loading={loading}
        >
          削除する
        </Button>
      </div>
    </Dialog>
  );
};
