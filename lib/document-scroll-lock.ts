/**
 * Reference-counted document scroll lock shared by all storefront overlays.
 * Releases always restore the original inline styles; independent modals can't
 * accidentally keep a stale overflow:hidden after the intro closes.
 */
let locks = 0;
let bodyOverflow = "";
let htmlOverflow = "";
export function lockDocumentScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  if (locks === 0) {
    bodyOverflow = document.body.style.overflow;
    htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }
  locks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
    }
  };
}
