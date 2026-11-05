export const ui = {
  colors: {
    text: "text-[#302d29]",
    textSoft: "text-[#82766a]",
    textMuted: "text-[#9f9383]",
    navy: "text-[#78654e]",
    navySoft: "text-[#6e5c49]",
    accent: "text-[#9b8263]",
    border: "border-[#ded6cb]",
    borderSoft: "border-[#e9e1d6]",
    bgSoft: "bg-[#f5f2ed]",
    bgSoftAlt: "bg-[#f0eae1]",
    bgPanel: "bg-white/88",
  },
  shadows: {
    soft: "shadow-[0_18px_60px_rgba(48,45,41,0.055)]",
    medium: "shadow-[0_22px_72px_rgba(48,45,41,0.08)]",
    strong: "shadow-[0_24px_80px_rgba(48,45,41,0.08)]",
    mobileBar: "shadow-[0_-18px_60px_rgba(48,45,41,0.10)]",
    button: "shadow-[0_16px_36px_rgba(48,45,41,0.18)]",
  },
  radius: {
    card: "rounded-[3px]",
    panel: "rounded-[3px]",
    pill: "rounded-full",
  },
};

export const springSheet = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 0.9,
};

export const springSoft = {
  type: "spring",
  stiffness: 210,
  damping: 24,
  mass: 1,
};

export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const checkoutSheetVariants = {
  initial: { opacity: 0, y: 140, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 140, scale: 0.985 },
};
