# Diego Aguilar Desarrollo Web

Portafolio profesional con cotizador, administración de proyectos, analítica de procedencia y controles de seguridad. La aplicación está construida con Next.js/Vinext para OpenAI Sites, Cloudflare D1 y R2.

## Funciones principales

- Página pública responsive con navbar flotante, modo claro/oscuro, proyectos dinámicos, proceso de trabajo, preguntas frecuentes y botón de WhatsApp.
- Cotizador con precio recalculado en el servidor, validación estricta, honeypot, límites de frecuencia, bloqueo de duplicados y Cloudflare Turnstile.
- Inicio de sesión administrativo propio con contraseña bcrypt, cookie HttpOnly/Secure/SameSite, sesiones revocables, vencimiento absoluto e inactividad máxima.
- Protección CSRF en inicio de sesión, cierre de sesión y todas las operaciones administrativas.
- Panel para agregar, editar, ordenar, destacar, publicar, ocultar y desactivar proyectos.
- Imágenes de proyectos almacenadas en R2; metadatos y contenido del portafolio en D1.
- Seguimiento de Instagram, TikTok, LinkedIn, Google, tráfico directo, campañas UTM, páginas de entrada, visitas, cotizaciones y conversión diaria.
- Registro de intentos fallidos, límites alcanzados, honeypots, duplicados y fallos de Turnstile.
- Encabezados CSP, HSTS, `nosniff`, bloqueo de iframes, política de referentes y permisos restringidos.

Automundo Premium y ResearchOS se crean como registros iniciales de la base de datos mediante la migración `0001`.

## Tecnologías

- Next.js 16, React 19 y TypeScript.
- Vinext/Vite para Cloudflare Workers.
- Drizzle ORM y Cloudflare D1.
- Cloudflare R2 para imágenes.
- bcryptjs para la comprobación de contraseñas.
- Cloudflare Turnstile para el cotizador.
- ESLint, TypeScript, Node Test Runner y Miniflare.

## Configuración local segura

Requisitos: Node.js 22.13 o superior y npm.

1. Instala las dependencias:

   ```bash
   npm ci
   ```

2. Crea un archivo privado `.env.local` tomando `.env.example` como referencia. Ese archivo está excluido de Git.

3. Elige localmente el valor de `ADMIN_USERNAME`. No escribas la contraseña en ningún archivo ni la envíes por chat.

4. Genera el hash y la sal de seguridad desde una terminal interactiva:

   ```bash
   npm run admin:password
   ```

   El comando oculta lo escrito, confirma la contraseña, imprime únicamente `ADMIN_PASSWORD_HASH` y `SECURITY_HASH_SALT`, y descarta la contraseña original.

5. Copia esos dos valores en `.env.local`.

6. Configura Turnstile con una clave pública y una clave secreta:

   ```env
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=clave-publica
   TURNSTILE_SECRET_KEY=clave-secreta
   ```

   La clave secreta nunca debe entrar al repositorio. Sin estas variables, el cotizador usa una verificación local durante desarrollo y permanece bloqueado en producción hasta completar la configuración real.

7. Para recibir un correo al llegar cada cotización, verifica tu dominio en Resend y configura:

   ```env
   RESEND_API_KEY=re_xxxxxxxxx
   LEAD_NOTIFICATION_EMAIL=diegoalejandroaguilarbello@gmail.com
   LEAD_FROM_EMAIL=Cotizaciones Diego Aguilar <cotizaciones@diegoaguilar.com>
   ```

   `RESEND_API_KEY` debe mantenerse como secreto. Si el correo falla, la cotización permanece guardada en el panel y el fallo se registra para revisión.

8. Aplica las migraciones en la base local. Este comando también inserta Automundo Premium y ResearchOS:

   ```bash
   npm run db:local:migrate
   ```

9. Inicia la aplicación:

   ```bash
   npm run dev
   ```

El panel está disponible en `/admin`. El formulario de acceso indicará claramente si las variables privadas todavía no están configuradas.

## Seguimiento de solicitudes

La sección `/admin/leads` permite marcar cada solicitud como nueva, contactada, con propuesta enviada, en progreso, finalizada o no concretada. También admite notas internas, archivo reversible y eliminación definitiva con confirmación. Todas las modificaciones usan la sesión administrativa y protección CSRF.

## Políticas de acceso predeterminadas

- Máximo de 5 intentos fallidos por usuario y dirección en 15 minutos.
- Límite adicional global por dirección para frenar rotación de usuarios.
- Sesión con duración máxima de 8 horas.
- Cierre por 30 minutos de inactividad.
- Cookie de sesión HttpOnly y SameSite Strict; `Secure` se activa automáticamente bajo HTTPS.
- Token CSRF separado y verificado contra la sesión almacenada.

Estos valores pueden ajustarse con las variables documentadas en `.env.example`.

## Enlaces de campaña

Ejemplos:

```text
/?utm_source=instagram&utm_medium=social&utm_campaign=lanzamiento
/?utm_source=tiktok&utm_medium=social&utm_campaign=lanzamiento
/?utm_source=linkedin&utm_medium=social&utm_campaign=portafolio
/?utm_source=google&utm_medium=cpc&utm_campaign=servicios_web
```

La primera atribución se conserva durante 30 días. Una nueva URL con parámetros UTM actualiza la campaña activa. Al completar el cotizador, la solicitud queda asociada con fuente, medio, campaña, página de entrada y sesión.

## Base de datos y archivos

- Esquema: `db/schema.ts`.
- Migraciones: `drizzle/`.
- D1 guarda proyectos, visitas, cotizaciones, sesiones y eventos de seguridad.
- R2 guarda los archivos JPG, PNG y WebP de proyectos, con límite de 5 MB y validación de firma.
- Los proyectos se eliminan de forma lógica: quedan desactivados y dejan de publicarse, sin borrar datos accidentalmente.

Después de modificar el esquema, genera y revisa una nueva migración:

```bash
npm run db:generate
```

## Verificación

```bash
npm run lint
npx tsc --noEmit
npm test
```

Las pruebas comprueban migraciones, datos iniciales, validación de campos, cálculo de precios en servidor, URLs de proyectos, cookies seguras, pantalla de acceso, CSRF y rechazo de API administrativas anónimas.

## Archivos principales

- Página pública: `app/page.tsx`.
- Diseño responsive: `app/globals.css`.
- Cotizador: `app/components/QuoteCalculator.tsx`.
- Acceso administrativo: `app/admin/login/` y `lib/admin-auth.ts`.
- Panel: `app/admin/(protected)/`.
- API de proyectos: `app/api/admin/projects/`.
- Analítica: `lib/analytics.ts` y `app/api/visits/route.ts`.
- Protección del cotizador: `app/api/leads/route.ts` y `lib/turnstile.ts`.

## Lista antes de publicar

- Configurar `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` y `SECURITY_HASH_SALT` como variables privadas del entorno publicado.
- Configurar las dos claves de Turnstile y registrar el dominio final en Cloudflare.
- Verificar el dominio en Resend y configurar las tres variables de notificación por correo.
- Confirmar que D1 y R2 están vinculados como `DB` y `BUCKET`.
- Ejecutar las migraciones.
- Probar acceso, cierre de sesión, creación de proyectos, subida de imagen y cotizador.
- Revisar los enlaces públicos, WhatsApp, correo, LinkedIn y GitHub.
- Probar al menos un iPhone y un teléfono Android reales antes de una campaña.
