"use client";

import { motion } from "framer-motion";

const shimmer =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent";

export default function DesktopFilterBarSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-1 pt-2 sm:px-6 sm:py-5 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 340,
          damping: 34,
          mass: 0.75,
        }}
        className="hidden lg:block"
        dir="rtl"
      >
        <div className="flex items-center justify-between rounded-[28px] border border-black/[0.06] bg-white/80 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div
              className={`${shimmer} h-11 w-[132px] rounded-2xl bg-black/[0.07]`}
            />
            <div
              className={`${shimmer} h-11 w-[154px] rounded-2xl bg-black/[0.055]`}
            />
            <div
              className={`${shimmer} h-11 w-[98px] rounded-2xl bg-black/[0.04]`}
            />
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`${shimmer} h-9 w-[128px] rounded-2xl bg-black/[0.045]`}
            />
            <div
              className={`${shimmer} h-9 w-[150px] rounded-2xl bg-black/[0.045]`}
            />
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </section>
  );
}
