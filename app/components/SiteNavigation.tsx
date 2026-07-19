"use client";

import { useState } from "react";

export default function SiteNavigation({ whatsapp }: { whatsapp: string }) {
  const [open, setOpen] = useState(false);

  function toggleTheme() {
    const next = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("da:theme", next ? "dark" : "light");
    } catch {
      // The selected theme still applies for the current page.
    }
  }

  return (
    <header className="navDock">
      <nav className="nav shell" aria-label="Navegación principal">
        <a className="brand" href="#inicio" aria-label="Diego Aguilar, inicio" onClick={() => setOpen(false)}>
          <span className="brandMark">DA</span>
          <span>Diego Aguilar</span>
        </a>
        <div className={open ? "navLinks open" : "navLinks"}>
          <a href="#servicios" onClick={() => setOpen(false)}>Servicios</a>
          <a href="#proyectos" onClick={() => setOpen(false)}>Proyectos</a>
          <a href="#proceso" onClick={() => setOpen(false)}>Proceso</a>
          <a href="#cotizador" onClick={() => setOpen(false)}>Cotizador</a>
          <a href="#preguntas" onClick={() => setOpen(false)}>Preguntas</a>
        </div>
        <div className="navActions">
          <button className="themeToggle" type="button" onClick={toggleTheme} aria-label="Cambiar entre modo claro y oscuro">
            <span>Tema</span>
          </button>
          <a className="button buttonSmall navCta" href={whatsapp} target="_blank" rel="noreferrer">Hablemos</a>
          <button className={open ? "menuToggle active" : "menuToggle"} type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-label="Abrir navegación"><span /><span /><span /></button>
        </div>
      </nav>
    </header>
  );
}
