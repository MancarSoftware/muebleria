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
- Imagen principal: `src/assets/hero-showroom.png`

## Catálogo administrable en Supabase

El propietario gestiona productos en `/admin`: crea borradores, sube fotos, edita textos y publica piezas. El sitio público y la asesoría IA solo leen productos publicados.

1. Crea un proyecto Supabase en la cuenta del cliente.
2. Ejecuta `supabase/migrations/202608120001_catalog.sql` en el SQL Editor.
3. Crea el usuario propietario en **Authentication → Users** y añade su UUID a `public.profiles` con rol `admin`, siguiendo el comentario al final de la migración.
4. Configura las cuatro variables de Supabase del archivo `.env.example`. En Vercel, las variables que comienzan con `VITE_` son públicas; la `SUPABASE_SERVICE_ROLE_KEY` es solo para el servidor.

Sin estas variables, el sitio conserva el catálogo de demostración y `/admin` muestra los pasos de conexión en lugar de permitir cambios.

### Variantes de color

Cada producto puede incluir tonos exactos y una fotografía específica por color. El visitante ve el color seleccionado, el tono real y, cuando existe, la imagen correspondiente; si no existe, la interfaz indica que la foto es referencial. Para proyectos Supabase que ya ejecutaron la migración inicial, ejecuta también `supabase/migrations/202608120002_product_color_variants.sql` en el SQL Editor. Después, gestiona cada variante desde el bloque **Colores y variantes** de `/admin`.

## Asesoría IA de catálogo

`api/recommendations.ts` es una función serverless compatible con Vercel. Configura `OPENAI_API_KEY` únicamente en las variables de entorno de Vercel. La clave nunca llega al bundle del navegador. Cuando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están configuradas, la función consulta el catálogo publicado del cliente antes de sugerir piezas.

Para desarrollo local de la asesoría, usa un entorno que ejecute funciones Vercel (por ejemplo `vercel dev`) tras definir `OPENAI_API_KEY`. Sin ese servicio, la interfaz usa una coincidencia local del catálogo para conservar una experiencia útil sin inventar resultados.
