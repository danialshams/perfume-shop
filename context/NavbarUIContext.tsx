"use client";

import { createContext, useContext } from "react";

export type NavbarUIState = {
  isScrolled: boolean;
  isHeaderHidden: boolean;
  navHeight: number;
};

export const NavbarUIContext = createContext<NavbarUIState>({
  isScrolled: false,
  isHeaderHidden: false,
  navHeight: 86,
});

export const useNavbarUI = () => useContext(NavbarUIContext);
