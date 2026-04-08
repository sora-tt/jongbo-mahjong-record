import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutFromApp } from "@/lib/auth/flows";
import { useAuth } from "@/providers/auth-provider";

export const useHeader = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleClose = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logoutFromApp();
      setIsMenuOpen(false);
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const name = user?.displayName ?? user?.email ?? null;

  return {
    name,
    isMenuOpen,
    setIsMenuOpen,
    handleClose,
    handleLogout,
    isLoggingOut,
  };
};
