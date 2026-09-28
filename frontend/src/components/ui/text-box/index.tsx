import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  variant?: keyof typeof textBoxStyles; // テキストボックスのスタイルを指定
  error?: string; // エラーメッセージ
  className?: string; // 追加のクラス名
};

const textBoxStyles = {
  default:
    "block w-full rounded-control border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:border-brand-strong focus:outline-none",
  brand:
    "block w-full rounded-control border-2 border-brand-500 bg-white px-3 py-2 text-sm text-foreground focus:border-brand-strong focus:outline-none",
  number:
    "w-20 rounded-control border border-border px-2 py-1 text-right text-foreground focus:border-brand-strong focus:outline-none",
  error:
    "block w-full rounded-control border-2 border-danger bg-white px-3 py-2 text-sm text-foreground focus:border-danger focus:outline-none",
} as const;

export const TextBox: React.FC<Props> = ({
  variant = "default", // デフォルトのスタイル
  error,
  className = "",
  ...props
}) => {
  const hasError = !!error;
  const effectiveVariant = hasError ? "error" : variant;

  return (
    <div className="flex flex-col">
      <input
        className={`${textBoxStyles[effectiveVariant]} ${className}`}
        {...props}
      />
      {error && (
        <span className="mt-1 text-sm text-danger" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
