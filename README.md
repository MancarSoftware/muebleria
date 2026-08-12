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

## Asistente IA seguro

`api/assistant.ts` es una función serverless compatible con Vercel. Configura `OPENAI_API_KEY` únicamente en las variables de entorno de Vercel. La clave nunca llega al bundle del navegador. La función entrega IDs y la interfaz resuelve esos IDs contra el catálogo local, de modo que no se muestran productos inventados.

Para desarrollo local del asistente, usa un entorno que ejecute funciones Vercel (por ejemplo `vercel dev`) tras definir `OPENAI_API_KEY`. Sin ese servicio, la interfaz enseña un estado de error claro.
