import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSessionFromServerContext } from "../../../lib/admin-auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getAdminSessionFromServerContext();
  if (session) redirect("/admin");
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <main className="loginPage">
      <section className="loginPanel" aria-labelledby="login-title">
        <Link className="brand loginBrand" href="/" aria-label="Volver al sitio">
          <span className="brandMark">DA</span>
          <span>Diego Aguilar</span>
        </Link>
        <div className="loginIntro">
          <p className="eyebrow"><span /> Acceso privado</p>
          <h1 id="login-title">Panel administrativo</h1>
          <p>Ingresa con las credenciales configuradas de forma privada en el servidor.</p>
        </div>
        <LoginForm next={next} />
        <Link className="loginBack" href="/">← Volver a la página pública</Link>
      </section>
      <aside className="loginAside" aria-hidden="true">
        <div className="loginAsideMark">DA</div>
        <p>Proyectos, prospectos y rendimiento en un solo lugar.</p>
      </aside>
    </main>
  );
}

function safeNext(value?: string) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/admin";
  return value.startsWith("/admin") ? value : "/admin";
}
