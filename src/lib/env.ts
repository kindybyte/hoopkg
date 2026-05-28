function read(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing required environment variable: ${name}. Скопируй .env.example в .env.local и заполни ключи.`
    );
  }
  return v;
}

export const env = {
  get SUPABASE_URL() {
    return read("NEXT_PUBLIC_SUPABASE_URL");
  },
  get SUPABASE_ANON_KEY() {
    return read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get SITE_URL() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  }
};

export function serverOnlyEnv() {
  return {
    SERVICE_ROLE_KEY: read("SUPABASE_SERVICE_ROLE_KEY")
  };
}
