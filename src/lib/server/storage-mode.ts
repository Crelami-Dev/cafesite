/** Vercel always uses persistent Supabase storage, regardless of local configuration. */
export function isCloudPrimaryEnv(): boolean {
  return process.env.VERCEL === "1" || process.env.CONTENT_SOURCE === "supabase";
}
