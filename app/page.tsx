import Image from "next/image";
import QuoteCalculator from "./components/QuoteCalculator";
import SiteNavigation from "./components/SiteNavigation";
import Tracking from "./components/Tracking";
import { listPublicProjects } from "../lib/projects";
import { PROJECT_TYPES } from "../lib/pricing";

export const dynamic = "force-dynamic";

const whatsapp =
  "https://wa.me/584247245512?text=Hola%20Diego%2C%20quiero%20cotizar%20una%20p%C3%A1gina%20web";

export default async function Home() {
  const projects = await listPublicProjects();

  return (
    <main>
      <Tracking />
      <SiteNavigation whatsapp={whatsapp} />

      <section className="hero shell" id="inicio">
        <div className="heroCopy reveal">
          <p className="eyebrow"><span /> Desarrollo web para negocios</p>
          <h1>Tu negocio merece una web que convierta visitas en clientes.</h1>
          <p className="heroText">
            Desarrollo páginas, sistemas y automatizaciones para presentar,
            vender y organizar mejor los procesos de tu negocio.
          </p>
          <div className="heroActions">
            <a className="button" href="#cotizador">Cotiza tu proyecto</a>
            <a className="textLink" href="#proyectos">Ver mi trabajo <span>↗</span></a>
          </div>
          <div className="trustRow" aria-label="Ventajas del servicio">
            <span>Atención directa</span>
            <span>Proyectos desde USD 120</span>
            <span>Diseño adaptable a celulares</span>
          </div>
        </div>

        <div className="portraitWrap reveal revealDelay" aria-label="Fotografía de Diego Aguilar">
          <div className="portraitGlow" />
          <Image
           className="portrait"
           src="/diego-aguilar.png"
           alt="Diego Aguilar, desarrollador web"
           width={720}
           height={720}
           priority
           unoptimized
           />
          <div className="availabilityCard">
            <span className="statusDot" />
            <div><strong>Disponible</strong><small>para nuevos proyectos</small></div>
          </div>
          <div className="codeCard" aria-hidden="true">
            <span>&lt;/&gt;</span>
            <div><strong>Full Stack</strong><small>React · Python · Node.js</small></div>
          </div>
        </div>
      </section>

      <section className="proofStrip" aria-label="Especialidades">
        <div className="shell proofInner">
          <span>PÁGINAS INFORMATIVAS</span><i>◆</i><span>CATÁLOGOS DIGITALES</span><i>◆</i>
          <span>SISTEMAS WEB</span><i>◆</i><span>AUTOMATIZACIONES</span>
        </div>
      </section>

      <section className="section shell" id="servicios">
        <p className="eyebrow"><span /> Servicios claros, resultados reales</p>
        <div className="sectionHeading">
          <h2>Una solución para la etapa actual de tu negocio.</h2>
          <p>Comienza con lo esencial y agrega funciones según el alcance real del proyecto.</p>
        </div>
        <div className="serviceGrid">
          {PROJECT_TYPES.map((service, index) => (
            <article className={service.badge === "Más solicitado" ? "featured" : ""} key={service.value}>
              <div className="serviceTop"><b>{String(index + 1).padStart(2, "0")}</b>{service.badge && <span>{service.badge}</span>}</div>
              <h3>{service.label}</h3>
              <p>{service.shortDescription}</p>
              <div className="servicePrice"><small>Desde</small><strong>USD {service.price}</strong></div>
              <p className="serviceIdeal"><b>Ideal para:</b> {service.idealFor}</p>
              <h4>Incluye desde:</h4>
              <ul>{service.includes.map((item) => <li key={item}>{item}</li>)}</ul>
              <a href={`#cotizador`} aria-label={`Cotizar ${service.label}`}>Cotizar esta opción <span>→</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="projects section shell" id="proyectos">
        <p className="eyebrow"><span /> Proyectos seleccionados</p>
        <div className="sectionHeading"><h2>Sistemas construidos para funcionar.</h2><p>Aplicaciones completas con interfaz, servidor, seguridad y base de datos.</p></div>
        <div className="projectGrid">
          {projects.map((project) => {
            const href = project.liveUrl || project.repoUrl;
            return (
              <article className={`projectCard ${project.isFeatured ? "projectFeatured" : ""}`} key={project.id}>
                <a href={href || "#proyectos"} target={href ? "_blank" : undefined} rel={href ? "noreferrer" : undefined} aria-label={`Ver ${project.title}`}>
                  <div className={`projectVisual projectTone-${project.slug}`}>
                    {project.imageUrl ? <Image src={project.imageUrl} alt={project.imageAlt} fill sizes="(max-width: 560px) 100vw, 50vw" unoptimized /> : <ProjectMonogram title={project.title} />}
                    {project.isFeatured && <span className="featuredBadge">Destacado</span>}
                    <i>{project.liveUrl ? "Ver proyecto ↗" : project.repoUrl ? "Ver código ↗" : "Caso de estudio"}</i>
                  </div>
                  <div className="projectInfo">
                    <div><h3>{project.title}</h3><p>{project.description}</p></div>
                    <div className="projectTech">{project.technologies.map((technology) => <small key={technology}>{technology}</small>)}</div>
                  </div>
                </a>
              </article>
            );
          })}
          {!projects.length && <div className="projectsEmpty"><h3>Portafolio en actualización</h3><p>Los casos publicados aparecerán nuevamente en breve.</p></div>}
        </div>
      </section>

      <section className="processSection section" id="proceso">
        <div className="shell">
          <p className="eyebrow"><span /> Cómo trabajaremos</p>
          <div className="sectionHeading"><h2>Un proceso claro desde la idea hasta la entrega.</h2><p>Sabrás qué se está construyendo, qué incluye y cuál es el siguiente paso.</p></div>
          <ol className="processGrid">
            <li><span>01</span><h3>Diagnóstico</h3><p>Definimos objetivo, público, contenido y funciones necesarias.</p></li>
            <li><span>02</span><h3>Alcance</h3><p>Recibes una propuesta con precio, tiempos y entregables concretos.</p></li>
            <li><span>03</span><h3>Desarrollo</h3><p>Construyo y revisamos avances funcionales durante el proceso.</p></li>
            <li><span>04</span><h3>Entrega</h3><p>Publicamos, verificamos la experiencia móvil y acordamos el soporte.</p></li>
          </ol>
        </div>
      </section>

      <section className="quoteSection" id="cotizador">
        <div className="shell">
          <p className="eyebrow light"><span /> Cotizador inteligente</p>
          <div className="quoteHeading"><h2>Convierte tu idea en un punto de partida.</h2><p>Obtén una estimación básica. Revisaré personalmente los requisitos antes de enviarte una cotización real.</p></div>
          <QuoteCalculator />
        </div>
      </section>

      <section className="trustSection section shell" aria-labelledby="trust-title">
        <div className="trustIntro"><p className="eyebrow"><span /> Indicadores de confianza</p><h2 id="trust-title">Criterios profesionales desde el primer contacto.</h2></div>
        <div className="trustGrid">
          <article><strong>Alcance documentado</strong><p>Funciones, entregables y límites definidos antes de comenzar.</p></article>
          <article><strong>Diseño responsive</strong><p>Revisión específica en computadora y pantallas móviles.</p></article>
          <article><strong>Datos protegidos</strong><p>Validación, controles contra abuso y prácticas seguras.</p></article>
          <article><strong>Comunicación directa</strong><p>Hablas conmigo durante el diagnóstico, desarrollo y entrega.</p></article>
        </div>
      </section>

      <section className="faqSection section shell" id="preguntas">
        <div><p className="eyebrow"><span /> Preguntas frecuentes</p><h2>Lo esencial antes de comenzar.</h2><p className="faqIntro">La cotización final depende del contenido, las integraciones y el alcance aprobado.</p></div>
        <div className="faqList">
          <details><summary>¿La estimación del cotizador es definitiva?</summary><p>Es una referencia inicial. El precio definitivo se confirma después de revisar funciones, contenido, integraciones y tiempos.</p></details>
          <details><summary>¿Puedo comenzar con una versión sencilla?</summary><p>Sí. Podemos organizar el proyecto por etapas y priorizar primero las funciones que aporten más valor al negocio.</p></details>
          <details><summary>¿La página funcionará en iPhone y Android?</summary><p>El diseño se adapta a pantallas móviles y se revisan navegación, formularios, lectura y acciones táctiles antes de la entrega.</p></details>
          <details><summary>¿Incluyes soporte después de publicar?</summary><p>La propuesta especifica el soporte incluido y las alternativas de mantenimiento según las necesidades del proyecto.</p></details>
          <details><summary>¿Qué se puede automatizar?</summary><p>Formularios, avisos por correo, seguimiento de prospectos, actualización de datos, reportes e integraciones entre herramientas. El precio base cubre un flujo principal conectado con hasta dos servicios.</p></details>
        </div>
      </section>

      <section className="about section shell">
        <div><p className="eyebrow"><span /> Trabajemos juntos</p><h2>Desarrollo web enfocado en necesidades reales.</h2></div>
        <div><p>Soy Diego Aguilar, desarrollador Full Stack y estudiante de Ingeniería en Computación. Creo soluciones claras, funcionales y adaptadas a la operación de negocios y emprendedores.</p><ul><li>Comunicación directa conmigo</li><li>Proceso y precios transparentes</li><li>Soporte definido desde la propuesta</li></ul><a className="button" href={whatsapp} target="_blank" rel="noreferrer">Cuéntame tu idea</a></div>
      </section>

      <a className="whatsappFloat" href={whatsapp} target="_blank" rel="noreferrer" aria-label="Escribir a Diego por WhatsApp"><span>WA</span><strong>WhatsApp</strong></a>

      <footer><div className="shell footerInner"><div><a className="brand footerBrand" href="#inicio"><span className="brandMark">DA</span><span>Diego Aguilar</span></a><p>Desarrollo web y automatizaciones para negocios y emprendedores.</p></div><div><strong>Contacto</strong><a href="tel:+584247245512">+58 424-7245512</a><a href="mailto:diegoalejandroaguilarbello@gmail.com">diegoalejandroaguilarbello@gmail.com</a><a href="https://www.instagram.com/diegoaguilarweb/" target="_blank" rel="noreferrer">@diegoaguilarweb</a></div><div><strong>Encuéntrame</strong><a href="https://www.instagram.com/diegoaguilarweb/" target="_blank" rel="noreferrer">Instagram</a><a href="https://www.linkedin.com/in/diego-alejandro-aguilar-bello-3b7353420" target="_blank" rel="noreferrer">LinkedIn</a><a href="https://github.com/diegoalejandroaguilarbello-tech" target="_blank" rel="noreferrer">GitHub</a><a href="/admin">Panel administrativo</a></div></div><div className="shell copyright">© 2026 Diego Aguilar. Cotizaciones sujetas a revisión.</div></footer>
    </main>
  );
}

function ProjectMonogram({ title }: { title: string }) {
  const words = title.split(/\s+/).filter(Boolean);
  return <div className="projectMonogram"><span>{words[0]}</span><strong>{words.slice(1).join(" ") || "Proyecto"}</strong></div>;
}
