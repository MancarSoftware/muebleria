# Casa Nativa

Plantilla comercial para una mueblería premium, construida con React, Vite y TypeScript.

## Inicio

```bash
npm install
npm run dev
```

## Personalización

- Identidad y contactos: `src/config/business.ts`
- Catálogo: `src/data/products.ts`
- Imagen principal: `src/assets/hero-showroom.webp`

## Catálogo administrable en Supabase

El propietario gestiona productos en `/admin`: crea borradores, sube fotos, edita textos y publica piezas. El sitio público y la asesoría IA solo leen productos publicados.

1. Crea un proyecto Supabase en la cuenta del cliente.
2. Para un proyecto nuevo, ejecuta las migraciones en orden: `supabase/migrations/202608120001_catalog.sql`, `202608120002_product_color_variants.sql`, `202608120003_space_proposals.sql`, `202608120004_site_analytics.sql` y `202608120005_site_analytics_sessions.sql`. Si el proyecto ya tiene catálogo y variantes, ejecuta las migraciones pendientes desde el SQL Editor de Supabase.
3. Crea el usuario propietario en **Authentication → Users** y añade su UUID a `public.profiles` con rol `admin`, siguiendo el comentario al final de la migración.
4. Configura las cuatro variables de Supabase del archivo `.env.example`. Las variables que comienzan con `VITE_` son públicas; la `SUPABASE_SERVICE_ROLE_KEY` es solo para funciones de servidor.

Sin estas variables, el sitio conserva el catálogo de demostración y `/admin` muestra los pasos de conexión en lugar de permitir cambios.

### Variantes de color

Cada producto puede incluir tonos exactos y una fotografía específica por color. El visitante ve el color seleccionado, el tono real y, cuando existe, la imagen correspondiente; si no existe, la interfaz indica que la foto es referencial. Para proyectos Supabase que ya ejecutaron la migración inicial, ejecuta también `supabase/migrations/202608120002_product_color_variants.sql` en el SQL Editor. Después, gestiona cada variante desde el bloque **Colores y variantes** de `/admin`.

### Propuestas de espacio y fotos

`/space` calcula la huella indicada en las dimensiones de cada pieza y reserva un margen conservador de circulación por categoría. Es una orientación comercial: la revisión final del showroom confirma puertas, ventanas y distribución. Al continuar, la propuesta se guarda en `public.space_proposals` antes de abrir WhatsApp; el propietario puede revisarlas en **Supabase → Table Editor → space_proposals**.

En un hosting con funciones de servidor, configura también `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. `api/space-proposals.ts` registra los leads desde el servidor; la clave de servicio nunca se expone al navegador. En GitHub Pages y local, la función `submit_space_proposal` guarda el lead y vuelve a leer el catálogo publicado para que sus piezas, precios y dimensiones no dependan del navegador.

Las nuevas fotos de productos y variantes se convierten en el navegador a WebP (máximo 1920 px) antes de subirse a Supabase Storage, con caché de un año. Esto reduce peso sin pedirle trabajo adicional al administrador.

## Asesoría IA de catálogo

`api/recommendations.ts` es una función serverless compatible con Vercel. Configura `OPENAI_API_KEY` únicamente en las variables de entorno de Vercel. La clave nunca llega al bundle del navegador. Cuando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están configuradas, la función consulta el catálogo publicado del cliente antes de sugerir piezas.

Para desarrollo local de la asesoría, usa un entorno que ejecute funciones Vercel (por ejemplo `vercel dev`) tras definir `OPENAI_API_KEY`. Sin ese servicio, la interfaz usa una coincidencia local del catálogo para conservar una experiencia útil sin inventar resultados.

## Demo en GitHub Pages

El flujo [deploy-pages.yml](.github/workflows/deploy-pages.yml) publica la rama `main` automáticamente. Antes del primer despliegue, en **GitHub → Settings → Pages**, selecciona **GitHub Actions** como fuente. En **Settings → Secrets and variables → Actions**, crea estos dos secretos con los valores públicos del proyecto Supabase:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_GA_MEASUREMENT_ID` (opcional; el ID público `G-...` de Google Analytics)

El flujo compila con rutas hash para que enlaces como `/#/catalog` o `/#/admin` funcionen sin configuración de servidor. GitHub Pages no ejecuta las funciones de `api/`, por eso en esta demo las propuestas se guardan de forma segura mediante la función SQL de Supabase. La asesoría IA conserva su alternativa local hasta desplegarla en una plataforma con funciones serverless.

### Aviso por correo de propuestas

Para recibir un email en `alemancar0511@gmail.com` cada vez que alguien guarda una propuesta, configura la función de Supabase incluida en [supabase/functions/notify-space-proposal](supabase/functions/notify-space-proposal). Necesitas una clave de Resend, que se mantiene exclusivamente en los secretos de Supabase. La guía exacta está en su [README](supabase/functions/notify-space-proposal/README.md).

### Estadísticas de visitas con Google Analytics

La integración se activa únicamente al definir `VITE_GA_MEASUREMENT_ID` con el ID público de una propiedad Google Analytics 4, por ejemplo `G-XXXXXXXXXX`. Además de visitas y páginas vistas, el sitio mide de forma anónima: `view_item`, `add_to_space`, `remove_from_space`, `generate_lead` y `contact_whatsapp`. Nunca se envían nombres, correos, teléfonos, notas ni el contenido de WhatsApp.

En Google Analytics, crea una propiedad **Web**, copia el Measurement ID desde **Admin → Data streams**, guárdalo como el secreto `VITE_GA_MEASUREMENT_ID` en GitHub y vuelve a desplegar. Después marca `generate_lead` como **Key event** en **Admin → Events** para ver claramente cuántas visitas terminan en propuesta. [Guía oficial de instalación](https://support.google.com/analytics/answer/15756615) · [Eventos de lead recomendados](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)

### Pulso en tiempo real sin Google Cloud

El panel de `/admin` también puede mostrar actividad anónima de los últimos 30 minutos sin conectar ninguna API de Google ni contratar otro servicio. Ejecuta `supabase/migrations/202608120004_site_analytics.sql` y `supabase/migrations/202608120005_site_analytics_sessions.sql` en **Supabase → SQL Editor** y vuelve a publicar el sitio. No necesita una variable de entorno nueva.

Cada visita inicia una sesión anónima. Después de 30 minutos sin actividad, una nueva visita del mismo navegador comienza otra sesión y vuelve a contarse. El panel separa visitas, vistas de página e interacciones reales: consulta de producto, favoritos, propuesta de espacio y WhatsApp. No se guardan nombres, correo, teléfono, mensajes, IP ni notas del visitante. Las filas no se pueden leer desde el navegador; el resumen agregado solo se entrega a perfiles `admin` o `editor`.
