import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode; // ボタン内のテキストや要素
  variant?: keyof typeof buttonStyles; // ボタンのスタイルを指定
  className?: string; // 追加のクラス名
};

const buttonStyles = {
  "blue-fill": "bg-blue-500 text-white",
  "yellow-outline":
    "border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white",
  "gray-disabled": "bg-gray-300 text-gray-700 cursor-not-allowed",
  "purple-gradient":
    "bg-gradient-to-r from-purple-400 to-purple-600 text-white hover:from-purple-600 hover:to-purple-400",
  "brand-primary":
    "flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors duration-150",
  "brand-secondary":
    "flex-1 px-4 py-2 border-2 border-brand-500 text-brand-600 font-medium rounded-lg hover:bg-brand-50 transition-colors duration-150",
} as const;

const Button: React.FC<Props> = ({
  children,
  variant = "brand-primary", // デフォルトのスタイル
  className = "",
  ...props
}) => {
  return (
    <button className={`${buttonStyles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
