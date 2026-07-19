import Link from "next/link";
import { requireAdminPage } from "../../../lib/admin-auth";
import AdminNavigation from "../components/AdminNavigation";
import LogoutButton from "../components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  return (
    <main className="adminLayout">
      <aside className="adminSidebar">
        <Link className="brand adminBrand" href="/">
          <span className="brandMark">DA</span>
          <span>Diego Aguilar</span>
        </Link>
        <AdminNavigation />
        <div className="adminAccount">
          <span>Sesión activa</span>
          <strong>{session.username}</strong>
          <LogoutButton />
        </div>
      </aside>
      <div className="adminContent">{children}</div>
    </main>
  );
}
