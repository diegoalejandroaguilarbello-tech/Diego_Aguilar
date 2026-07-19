"use client";

import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/leads", label: "Solicitudes" },
  { href: "/admin/projects", label: "Proyectos" },
  { href: "/admin/analytics", label: "Estadísticas" },
];

export default function AdminNavigation() {
  const pathname = usePathname();
  return (
    <nav className="adminNav" aria-label="Navegación del panel">
      {links.map((link) => (
        <a key={link.href} href={link.href} className={pathname === link.href ? "active" : ""}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}
