import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  variant?: keyof typeof textBoxStyles; // テキストボックスのスタイルを指定
  error?: string; // エラーメッセージ
  className?: string; // 追加のクラス名
};

const textBoxStyles = {
  default:
    "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
  brand:
    "block w-full px-3 py-2 border-2 border-brand-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm",
  number:
    "w-20 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500",
  error:
    "block w-full px-3 py-2 border-2 border-red-500 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm",
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
      {error && <span className="mt-1 text-sm text-red-500">{error}</span>}
    </div>
  );
};
