import { createClient } from '@supabase/supabase-js';

// Keep only the origin, so a pasted ".../rest/v1/" or trailing slash does not break requests.
const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const url = rawUrl ? new URL(rawUrl).origin : undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** null when the .env keys are not filled in yet; the site then uses the built-in menu. */
export const supabase = url && key ? createClient(url, key) : null;

export const BUCKET = 'menu-images';
