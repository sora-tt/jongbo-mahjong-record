import { useState } from "react";

import { userData1 } from "@/mocks/user";

export const useHeader = () => {
  const { name } = userData1;

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleClose = () => setIsMenuOpen(false);
  const handleLogout = () => {
    // TODO: ログアウト処理を入れる
    setIsMenuOpen(false);
  };

  return { name, isMenuOpen, setIsMenuOpen, handleClose, handleLogout };
};
