"use client";

import { Dispatch, RefObject, SetStateAction, useEffect } from "react";

type UseNavbarKeyboardParams = {
  desktopSearchRef: RefObject<HTMLInputElement | null>;
  mobileSearchRef: RefObject<HTMLInputElement | null>;
  updateHeaderHidden: (hidden: boolean) => void;
  updateMobileSearchVisible: (visible: boolean) => void;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export function useNavbarKeyboard({
  desktopSearchRef,
  mobileSearchRef,
  updateHeaderHidden,
  updateMobileSearchVisible,
  setIsOpen,
}: UseNavbarKeyboardParams) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = typeof event.key === "string" ? event.key.toLowerCase() : "";

      if (key === "escape") {
        setIsOpen(false);
        updateHeaderHidden(false);
        updateMobileSearchVisible(false);
        desktopSearchRef.current?.blur();
        mobileSearchRef.current?.blur();
      }

      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();

        updateHeaderHidden(false);

        if (window.innerWidth < 768) {
          updateMobileSearchVisible(true);

          window.setTimeout(() => {
            mobileSearchRef.current?.focus();
          }, 220);
        } else {
          desktopSearchRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    desktopSearchRef,
    mobileSearchRef,
    updateHeaderHidden,
    updateMobileSearchVisible,
    setIsOpen,
  ]);
}
