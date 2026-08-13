# Notificación de propuestas

Esta función recibe el webhook de inserciones en `public.space_proposals` y envía un correo al responsable mediante Resend.

## Configuración de demo

1. Crea una cuenta gratuita en Resend y verifica el correo destinatario `alemancar0511@gmail.com`. Para una demo se puede usar `onboarding@resend.dev` como remitente; para un dominio propio, verifícalo en Resend y configura `RESEND_FROM`.
2. En Supabase, abre **Edge Functions** y crea/despliega `notify-space-proposal` con el archivo `index.ts` de esta carpeta. Mantén **Verify JWT** activado.
3. En **Edge Functions → Secrets**, añade:
   - `RESEND_API_KEY`
   - `NOTIFICATION_EMAIL=alemancar0511@gmail.com`
   - Opcional: `RESEND_FROM=Casa Nativa <hola@tudominio.com>` cuando el dominio esté verificado.
4. En **Database → Webhooks**, crea un webhook:
   - Nombre: `notify-space-proposal`
   - Tabla: `space_proposals`
   - Evento: `Insert`
   - Tipo: `Supabase Edge Function`
   - Función: `notify-space-proposal`
   - Añade el encabezado de autorización con la service key desde el asistente del panel.
5. Envía una propuesta de prueba desde `/space`; el correo llega a `alemancar0511@gmail.com` y la fila queda registrada en `space_proposals`.

No agregues `RESEND_API_KEY` a `.env.local`, al repositorio ni a variables `VITE_`.
