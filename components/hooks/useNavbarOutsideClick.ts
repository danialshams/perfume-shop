"use client";

import { Dispatch, RefObject, SetStateAction, useEffect } from "react";

type UseNavbarOutsideClickParams = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  menuRef: RefObject<HTMLDivElement | null>;
  mobileSearchRef: RefObject<HTMLInputElement | null>;
  mobileSearchWrapperRef: RefObject<HTMLDivElement | null>;
  mobileSearchVisibleRef: RefObject<boolean>;
  updateMobileSearchVisible: (visible: boolean) => void;
};

export function useNavbarOutsideClick({
  isOpen,
  setIsOpen,
  menuRef,
  mobileSearchRef,
  mobileSearchWrapperRef,
  mobileSearchVisibleRef,
  updateMobileSearchVisible,
}: UseNavbarOutsideClickParams) {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (isOpen) {
        const clickedInsideMenu = menuRef.current?.contains(target);

        if (!clickedInsideMenu) {
          setIsOpen(false);
        }
      }

      if (window.innerWidth < 768 && mobileSearchVisibleRef.current) {
        const clickedInsideSearch =
          mobileSearchWrapperRef.current?.contains(target);

        if (!clickedInsideSearch) {
          mobileSearchRef.current?.blur();
          updateMobileSearchVisible(false);
        }
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [
    isOpen,
    setIsOpen,
    menuRef,
    mobileSearchRef,
    mobileSearchWrapperRef,
    mobileSearchVisibleRef,
    updateMobileSearchVisible,
  ]);
}
