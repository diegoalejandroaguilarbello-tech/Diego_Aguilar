import vinext from "vinext";
import { defineConfig, loadEnv } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const LOCAL_RUNTIME_VARIABLES = [
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD_HASH",
  "SECURITY_HASH_SALT",
  "ADMIN_SESSION_HOURS",
  "ADMIN_IDLE_TIMEOUT_MINUTES",
  "ADMIN_LOGIN_MAX_ATTEMPTS",
  "ADMIN_LOGIN_WINDOW_MINUTES",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "RESEND_API_KEY",
  "LEAD_NOTIFICATION_EMAIL",
  "LEAD_FROM_EMAIL",
] as const;

export default defineConfig(async ({ command, mode }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Only the local dev server receives values from ignored .env files. Builds
  // never embed credentials; published values are injected by Sites at runtime.
  const fileEnv = command === "serve" ? loadEnv(mode, process.cwd(), "") : {};
  const localVars = command === "serve"
    ? Object.fromEntries(LOCAL_RUNTIME_VARIABLES.flatMap((name) => {
        const value = process.env[name] ?? fileEnv[name];
        return value ? [[name, value]] : [];
      }))
    : {};

  const localBindingConfig = {
    main: "./worker/index.ts",
    compatibility_flags: ["nodejs_compat"],
    vars: localVars,
    d1_databases: d1
      ? [
          {
            binding: d1,
            database_name: "site-creator-d1",
            database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
          },
        ]
      : [],
    r2_buckets: r2
      ? [
          {
            binding: r2,
            bucket_name: "site-creator-r2",
          },
        ]
      : [],
  };

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: command === "serve" ? localBindingConfig : undefined,
      }),
    ],
  };
});
