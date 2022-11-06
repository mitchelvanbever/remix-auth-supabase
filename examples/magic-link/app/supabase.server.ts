import { createClient } from '@supabase/supabase-js';
import type { ApiError, Session } from '@supabase/supabase-js';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SUPABASE_URL: string;
      SUPABASE_SERVICE_ROLE: string;
      PUBLIC_SUPABASE_ANON_KEY: string;
      SERVER_URL: string;
    }
  }
}

if (!process.env.SUPABASE_URL) throw new Error('ENV: SUPABASE_URL is required');

if (!process.env.SUPABASE_SERVICE_ROLE) throw new Error('ENV: SUPABASE_SERVICE_ROLE is required');

if (!process.env.SERVER_URL) throw new Error('ENV: SERVER_URL is required');

// Supabase options example (build your own :))
// https://supabase.com/docs/reference/javascript/initializing#with-additional-parameters

// const supabaseOptions = {
//   fetch, // see ⚠️ cloudflare
//   schema: "public",
//   persistSession: true,
//   autoRefreshToken: true,
//   detectSessionInUrl: true,
//   headers: { "x-application-name": "{my-site-name}" }
// };

// ⚠️ cloudflare needs you define fetch option : https://github.com/supabase/supabase-js#custom-fetch-implementation
// Use Remix fetch polyfill for node (See https://remix.run/docs/en/v1/other-api/node)
export const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

export { Session, ApiError };
