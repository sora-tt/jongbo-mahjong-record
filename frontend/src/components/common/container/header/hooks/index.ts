import { useState } from "react";

import { mockUser } from "@/mocks/user";

export const useHeader = () => {
  const userName = mockUser.name;

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleClose = () => setIsMenuOpen(false);
  const handleLogout = () => {
    // TODO: ログアウト処理を入れる
    setIsMenuOpen(false);
  };

  return { userName, isMenuOpen, setIsMenuOpen, handleClose, handleLogout };
};
