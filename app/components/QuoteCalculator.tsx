"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { getAttribution } from "../../lib/client-attribution";
import { PROJECT_EXTRAS, PROJECT_TYPES } from "../../lib/pricing";
import TurnstileWidget from "./TurnstileWidget";

export default function QuoteCalculator() {
  const [type, setType] = useState("informativa");
  const [selected, setSelected] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);

  const base = PROJECT_TYPES.find((item) => item.value === type) ?? PROJECT_TYPES[0];
  const total = useMemo(
    () => base.price + PROJECT_EXTRAS.filter((item) => selected.includes(item.value)).reduce((sum, item) => sum + item.price, 0),
    [base.price, selected],
  );

  function toggle(value: string) {
    setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || !turnstileToken) return;
    setSending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const attribution = getAttribution();
    const payload = {
      name: form.get("name"),
      business: form.get("business"),
      whatsapp: form.get("whatsapp"),
      email: form.get("email"),
      details: form.get("details"),
      website: form.get("website"),
      projectType: type,
      extras: selected,
      turnstileToken,
      ...attribution,
    };
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string; estimatedPrice?: number };
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la solicitud");
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos enviar la solicitud. Intenta nuevamente.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    const text = `Hola Diego, envié una solicitud para ${base.label}. La estimación inicial fue de USD ${total}.`;
    return <div className="quoteSuccess" role="status"><span>✓</span><h3>Solicitud recibida</h3><p>Revisaré personalmente tus requisitos para preparar la cotización real.</p><a className="button" href={`https://wa.me/584247245512?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">Continuar por WhatsApp</a></div>;
  }

  return (
    <form className="calculator" onSubmit={submit} noValidate>
      <div className="calcOptions">
        <div className="calcBlock">
          <span className="step">01</span><div><h3>¿Qué necesitas?</h3><p>Selecciona el punto de partida.</p></div>
          <div className="typeGrid">
            {PROJECT_TYPES.map((item) => <label className={type === item.value ? "choice active" : "choice"} key={item.value}><input type="radio" name="type" value={item.value} checked={type === item.value} onChange={() => setType(item.value)} /><span><b>{item.label}</b><small>Desde USD {item.price} · {item.time}</small></span>{item.badge && <em>{item.badge}</em>}</label>)}
          </div>
          <div className="selectedPackage">
            <div><small>La opción básica incluye</small><strong>{base.label}</strong></div>
            <ul>{base.includes.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
        <div className="calcBlock">
          <span className="step">02</span><div><h3>Agrega funciones</h3><p>Puedes elegir más de una.</p></div>
          <div className="extraGrid">
            {PROJECT_EXTRAS.map((item) => <label className={selected.includes(item.value) ? "extra active" : "extra"} key={item.value}><input type="checkbox" checked={selected.includes(item.value)} onChange={() => toggle(item.value)} /><span>{item.label}</span><b>+${item.price}</b></label>)}
          </div>
        </div>
        <div className="calcBlock contactFields">
          <span className="step">03</span><div><h3>Cuéntame sobre ti</h3><p>Datos necesarios para responderte.</p></div>
          <label>Nombre<input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Tu nombre" /></label>
          <label>Negocio<input name="business" required minLength={2} maxLength={120} autoComplete="organization" placeholder="Nombre o tipo de negocio" /></label>
          <label>WhatsApp<input name="whatsapp" required minLength={8} maxLength={40} inputMode="tel" autoComplete="tel" placeholder="Código de país + número" /></label>
          <label>Correo (opcional)<input name="email" type="email" maxLength={160} autoComplete="email" placeholder="correo@ejemplo.com" /></label>
          <label className="full">Detalles<textarea name="details" rows={4} maxLength={1500} placeholder="¿Qué quieres lograr con tu página?" /></label>
          <label className="honeypot" aria-hidden="true">Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
      </div>
      <aside className="estimateCard">
        <p>Estimación inicial</p><strong>USD {total}</strong><small>Precio orientativo según tu selección</small>
        <div className="estimateBreakdown"><div><span>Servicio base</span><b>USD {base.price}</b></div>{PROJECT_EXTRAS.filter((item) => selected.includes(item.value)).map((item) => <div key={item.value}><span>{item.label}</span><b>+ USD {item.price}</b></div>)}</div>
        <dl><div><dt>Tipo</dt><dd>{base.label}</dd></div><div><dt>Funciones extra</dt><dd>{selected.length}</dd></div><div><dt>Tiempo estimado</dt><dd>{base.time}</dd></div><div><dt>Pago inicial sugerido (50 %)</dt><dd>USD {Math.round(total / 2)}</dd></div></dl>
        <TurnstileWidget onToken={onTurnstileToken} />
        <button className="button" disabled={sending || !turnstileToken}>{sending ? "Enviando…" : !turnstileToken ? "Completa la verificación" : "Solicitar revisión"}</button>
        <p className="estimateNote">Precio orientativo. Dominio, hosting, pasarelas y suscripciones externas se cotizan aparte. Revisaré el alcance antes de enviarte la propuesta definitiva.</p>
        <div className="formStatus" aria-live="polite">{error && <p className="formError">{error}</p>}</div>
      </aside>
    </form>
  );
}
