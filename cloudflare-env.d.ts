declare global {
  namespace Cloudflare {
    interface Env {
      DB: D1Database;
      BUCKET: R2Bucket;
      ADMIN_USERNAME?: string;
      ADMIN_PASSWORD_HASH?: string;
      SECURITY_HASH_SALT?: string;
      TURNSTILE_SECRET_KEY?: string;
      NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string;
    }
  }
}

export {};
