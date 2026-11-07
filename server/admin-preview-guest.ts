/** Visual-only anonymous access to the FERTINI test branch.
 * All admin APIs continue to require an actual admin session.
 */
export function isFertiniPreviewGuestEnabled():boolean{
 return process.env.VERCEL_ENV==="preview" &&
  process.env.VERCEL_GIT_COMMIT_REF==="feature/fertini-essential-admin-studio-20261106";
}
