"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [csrf, setCsrf] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/csrf", { credentials: "same-origin", cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("csrf");
        return response.json() as Promise<{ token: string }>;
      })
      .then((data) => setCsrf(data.token))
      .catch(() => setError("No se pudo iniciar la verificación de seguridad. Recarga la página."));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!csrf || loading) return;
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "No se pudo iniciar sesión");
      router.replace(next);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="loginForm" onSubmit={submit}>
      <label>
        Usuario
        <input name="username" autoComplete="username" maxLength={80} required disabled={loading} />
      </label>
      <label>
        Contraseña
        <input name="password" type="password" autoComplete="current-password" maxLength={200} required disabled={loading} />
      </label>
      {error && <p className="formError" role="alert">{error}</p>}
      <button className="button" type="submit" disabled={!csrf || loading}>
        {loading ? "Verificando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
