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

## Asesoría IA de catálogo

`api/recommendations.ts` es una función serverless compatible con Vercel. Configura `OPENAI_API_KEY` únicamente en las variables de entorno de Vercel. La clave nunca llega al bundle del navegador. Cuando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están configuradas, la función consulta el catálogo publicado del cliente antes de sugerir piezas.

Para desarrollo local de la asesoría, usa un entorno que ejecute funciones Vercel (por ejemplo `vercel dev`) tras definir `OPENAI_API_KEY`. Sin ese servicio, la interfaz usa una coincidencia local del catálogo para conservar una experiencia útil sin inventar resultados.
