function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Скопируй .env.example в .env.local и заполни ключи.`
    );
  }
  return value;
}

// IMPORTANT: NEXT_PUBLIC_* must be accessed by literal property name so
// Next.js can inline the value into the client bundle at build time.
// Dynamic access like process.env[name] is not inlined → client sees undefined.
export const env = {
  get SUPABASE_URL() {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get SUPABASE_ANON_KEY() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
  get SITE_URL() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  }
};

export function serverOnlyEnv() {
  return {
    SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY)
  };
}
