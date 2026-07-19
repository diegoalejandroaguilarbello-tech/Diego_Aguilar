# Activar solicitudes y avisos por correo

## 1. Instalar y migrar

```bash
npm ci
npm run db:local:migrate
```

La migración `0002_plain_rocket_raccoon.sql` conserva las cotizaciones existentes y añade seguimiento, fecha de actualización y archivo.

## 2. Configurar Resend

1. Crea una cuenta en Resend.
2. Agrega y verifica `diegoaguilar.com` siguiendo los registros DNS que Resend indique.
3. Crea una API key con permiso de envío.
4. Configura estas variables en tu `.env.local` privado:

```env
RESEND_API_KEY=re_xxxxxxxxx
LEAD_NOTIFICATION_EMAIL=diegoalejandroaguilarbello@gmail.com
LEAD_FROM_EMAIL=Cotizaciones Diego Aguilar <cotizaciones@diegoaguilar.com>
```

No compartas `RESEND_API_KEY` ni subas `.env.local`. En producción configura los mismos valores en el panel privado del alojamiento.

## 3. Usar el seguimiento

Abre `/admin/leads`. Cada solicitud puede quedar como Nueva, Contactado, Propuesta enviada, En progreso, Finalizado o No concretado. Las notas son internas. Archivar es reversible; “Eliminar definitivamente” borra el registro después de una confirmación.

## 4. Seguridad después del ZIP anterior

El ZIP anterior incluyó accidentalmente `.env.local`. Genera un nuevo hash administrativo con `npm run admin:password` y rota cualquier clave real de Turnstile que estuviera en ese archivo. No reutilices secretos incluidos en un archivo compartido.
