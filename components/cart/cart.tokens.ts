export const ui = {
  colors: {
    text: "text-[#172033]",
    textSoft: "text-[#6B7280]",
    textMuted: "text-[#8B95A7]",
    navy: "text-[#17345F]",
    navySoft: "text-[#24466F]",
    accent: "text-[#6F8FB6]",
    border: "border-[#E4EAF1]",
    borderSoft: "border-[#E9EEF5]",
    bgSoft: "bg-[#F8FAFC]",
    bgSoftAlt: "bg-[#F6F9FC]",
    bgPanel: "bg-white/88",
  },
  shadows: {
    soft: "shadow-[0_18px_60px_rgba(23,52,95,0.055)]",
    medium: "shadow-[0_22px_72px_rgba(23,52,95,0.08)]",
    strong: "shadow-[0_24px_80px_rgba(23,52,95,0.08)]",
    mobileBar: "shadow-[0_-18px_60px_rgba(23,52,95,0.10)]",
    button: "shadow-[0_16px_36px_rgba(23,52,95,0.18)]",
  },
  radius: {
    card: "rounded-[28px] md:rounded-[30px]",
    panel: "rounded-[32px]",
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
