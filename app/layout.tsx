import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { CartCountProvider } from "@/context/CartCountContext";
import BackgroundMusic from "@/components/NavbarComponents/BackgroundMusic";
import { cn } from "@/lib/utils";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "فروشگاه عطر",
  description: "فروشگاه اینترنتی عطر و ادکلن",
};

/**
 * قبل از رندر بقیه‌ی body اجرا می‌شود.
 * کلید باید با LOADER_SESSION_KEY در initial-loader یکی باشد.
 */
const INTRO_FLAG_SCRIPT = `
(function () {
  var d = document.documentElement;

  try {
    var k = "fertini:loader:seen";

    if (window.sessionStorage.getItem(k) === "1") {
      d.classList.add("fx-intro-seen");
    } else {
      window.sessionStorage.setItem(k, "1");
    }
  } catch (e) {}

  d.setAttribute("data-fx-intro", "ready");
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={cn("h-full antialiased font-sans", geist.variable)}
    >
      <head>
        <script
          id="fx-intro-flag"
          dangerouslySetInnerHTML={{ __html: INTRO_FLAG_SCRIPT }}
        />
      </head>

      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col font-sans"
      >
        <CartCountProvider>{children}</CartCountProvider>


        <BackgroundMusic audioUrl="/audio/luxury-piano.mp3" />
      </body>
    </html>
  );
}
