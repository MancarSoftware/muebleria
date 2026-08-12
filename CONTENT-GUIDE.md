# Guía de contenido y personalización

Esta plantilla permite reemplazar la identidad de un cliente sin rediseñar el sitio.

| Contenido | Ubicación | Recomendación |
|---|---|---|
| Nombre, teléfono, WhatsApp, correo, dirección y horarios | `src/config/business.ts` | Reemplazar antes de publicar. El WhatsApp va sin `+` ni espacios. |
| Productos, precios, dimensiones, materiales y colores | `src/data/products.ts` | Una entrada por producto y un `id` / `slug` único. |
| Fotos de catálogo | Campo `images` de cada producto | Principal vertical o 4:5, desde 1400 px de ancho. |
| Foto de portada | `src/assets/hero-showroom.png` | Interior horizontal 2400×1350 px con área libre a la izquierda. |
| Espacios, colecciones e inspiración | `src/pages/ContentPages.tsx` | Sustituir títulos, relatos e imágenes con la propuesta real. |
| Historia y principios de marca | `About` en `src/pages/ContentPages.tsx` | Usar origen, oficio, proceso, garantías o materiales verdaderos. |
| Formulario | `ContactForm` en `src/pages/ContentPages.tsx` | Conectar a Resend, Formspree o un endpoint propio. |
| Asistente IA | `api/assistant.ts` y `OPENAI_API_KEY` | Desplegar como función serverless; nunca exponer la clave con `VITE_`. |

## Secuencia recomendada antes de publicar

1. Cargar identidad y datos reales de contacto.
2. Sustituir catálogo, precios y fotografías reales.
3. Actualizar historias de ambientes, colecciones e inspiración.
4. Conectar formulario y configurar el endpoint seguro de IA.
5. Probar navegación, enlaces de WhatsApp y vista móvil.
