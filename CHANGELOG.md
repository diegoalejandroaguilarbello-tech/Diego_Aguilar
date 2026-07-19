# Cambios de seguridad y administración

## 2026-07-19

- Reorganizados los precios base y extras con una estructura comercial coherente.
- Añadida la categoría Automatización de procesos al sitio y al cotizador.
- Incorporado el contenido, límites, público ideal y tiempo estimado de cada categoría.
- Mejorado el cotizador con desglose del servicio base, extras, total y pago inicial sugerido.
- Añadido Instagram `@diegoaguilarweb` a la página pública.
- Creado un catálogo comercial en PDF con servicios, precios, condiciones y contacto.

## 2026-07-17

- Corregido el cierre de sesión con validación de respuesta, mensaje de error y redirección completa compatible con navegadores móviles.
- Añadida la sección Solicitudes con estados comerciales, notas internas, filtros, archivo, restauración y eliminación definitiva protegida.
- Añadidas notificaciones de nuevas cotizaciones por correo mediante Resend; los fallos de correo no eliminan solicitudes.
- Añadida la migración de seguimiento de solicitudes y mejoras responsive del panel.

## 2026-07-16

- Sustituido el acceso administrativo basado únicamente en identidad externa por una pantalla propia de credenciales privadas.
- Añadidas contraseñas bcrypt, sesiones persistentes revocables, expiración, cierre por inactividad, cookies seguras, CSRF y límites de acceso.
- Protegidas todas las rutas y API administrativas.
- Añadidas tablas de proyectos, sesiones y eventos de seguridad; ampliadas visitas y cotizaciones con atribución.
- Migrados Automundo Premium y ResearchOS a D1.
- Añadido panel completo de proyectos con publicación, orden, destacados, desactivación e imágenes R2.
- Añadida analítica por fuente, medio, campaña, entrada y fecha, con conversiones y cotizaciones por canal.
- Endurecido el cotizador con precio calculado por el servidor, validación, honeypot, Turnstile, límites, duplicados y tamaño máximo.
- Añadidos modo claro/oscuro, navbar flotante, proceso, preguntas frecuentes, confianza, WhatsApp y mejoras para iPhone.
- Añadidos CSP, HSTS y otros encabezados de seguridad.
- Incorporadas pruebas de migraciones, cálculo, validación, cookies, CSRF y autorización.
