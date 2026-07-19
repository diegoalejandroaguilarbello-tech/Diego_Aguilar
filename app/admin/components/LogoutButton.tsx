"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setLoading(true);
    setError("");
    const csrf = readCookie("da_admin_csrf");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "x-csrf-token": csrf },
      });
      if (!response.ok && response.status !== 401) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || "No se pudo cerrar la sesión");
      }
      window.location.replace("/admin/login");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo cerrar la sesión");
      setLoading(false);
    }
  }

  return <><button className="adminLogout" type="button" onClick={logout} disabled={loading}>{loading ? "Cerrando…" : "Cerrar sesión"}</button>{error && <small className="adminLogoutError" role="alert">{error}</small>}</>;
}

function readCookie(name: string) {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? "";
}
