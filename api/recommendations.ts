import OpenAI from 'openai';
import { products as fallbackProducts } from '../src/data/products';

type AdvisorSpace = 'sala' | 'comedor' | 'dormitorio' | 'oficina';
type AdvisorPriority = 'confort' | 'reunir' | 'descansar' | 'trabajar';
type Profile = { space?: AdvisorSpace; size?: 'compacto' | 'medio' | 'amplio'; budget?: number | null; priority?: AdvisorPriority; measurements?: string; notes?: string; contextProductId?: string };
type Request = { method?: string; body?: { profile?: Profile } };
type Response = { status: (statusCode: number) => { json: (body: unknown) => void } };
type CatalogProduct = { id: string; name: string; category: string; price: number; description: string; materials: string[]; dimensions: string; colors: string[]; tags: string[]; featured: boolean };

const spaceTags: Record<AdvisorSpace, string[]> = { sala: ['sala'], comedor: ['comedor'], dormitorio: ['dormitorio'], oficina: ['oficina'] };
const priorityTags: Record<AdvisorPriority, string[]> = { confort: ['sofá', 'sofa', 'sala'], reunir: ['mesa', 'silla', 'comedor'], descansar: ['cama', 'dormitorio'], trabajar: ['escritorio', 'oficina'] };

function roomLimit(measurements = '') {
  const values = measurements.match(/\d+(?:[.,]\d+)?/g)?.map((value) => Number(value.replace(',', '.'))) ?? [];
  if (values.length < 2) return null;
  return Math.max(...values.map((value) => value > 20 ? value : value * 100));
}

async function getCatalog(): Promise<CatalogProduct[]> {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceRoleKey) {
    try {
      const response = await fetch(`${url}/rest/v1/products?select=id,name,category,price,description,materials,dimensions,colors,tags,featured&status=eq.published`, { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } });
      if (response.ok) return await response.json() as CatalogProduct[];
    } catch { /* Fall back to the bundled catalog until the cloud catalog is reachable. */ }
  }
  return fallbackProducts;
}

function eligibleCatalog(profile: Profile, catalog: CatalogProduct[]) {
  const maximum = roomLimit(profile.measurements);
  return catalog.filter((product) => {
    const productWidth = Number(product.dimensions.match(/\d+/)?.[0]) || 0;
    const isInSpace = profile.space ? spaceTags[profile.space].some((tag) => product.tags.includes(tag)) : true;
    const isWithinBudget = profile.budget ? product.price <= profile.budget : true;
    const leavesPassage = maximum ? productWidth <= maximum - 40 : true;
    return isInSpace && isWithinBudget && leavesPassage;
  });
}

export default async function handler(request: Request, response: Response) {
  if (request.method !== 'POST') return response.status(405).json({ message: 'Method not allowed.' });
  const profile = request.body?.profile;
  if (!profile?.space || !profile.size || !profile.priority) return response.status(400).json({ message: 'Incomplete advisor profile.', recommendations: [] });
  if (!process.env.OPENAI_API_KEY) return response.status(503).json({ message: 'AI service is not configured.', recommendations: [] });

  const eligible = eligibleCatalog(profile, await getCatalog());
  if (eligible.length === 0) return response.status(200).json({ message: 'No encontramos piezas actuales que cumplan exactamente con estas condiciones. El showroom puede revisar alternativas o próximas llegadas.', recommendations: [], availabilityNote: 'La disponibilidad, acabados y fecha de entrega se confirman con el showroom antes de reservar.' });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const recommendation = await client.responses.create({
      model: 'gpt-5.6-luna',
      reasoning: { effort: 'low' },
      text: { format: { type: 'json_schema', name: 'catalog_recommendation', strict: true, schema: {
        type: 'object', additionalProperties: false, required: ['message', 'recommendations', 'availabilityNote'], properties: {
          message: { type: 'string', description: 'A concise Spanish explanation of the curated selection.' },
          recommendations: { type: 'array', maxItems: 3, items: { type: 'object', additionalProperties: false, required: ['productId', 'reason'], properties: { productId: { type: 'string' }, reason: { type: 'string', description: 'One concise Spanish reason based only on catalog facts.' } } } },
          availabilityNote: { type: 'string', description: 'Always state that the showroom confirms availability, finishes, and delivery date.' },
        },
      } } },
      input: [
        { role: 'developer', content: `You are Casa Nativa's furniture advisor. The application already pre-filtered the catalog by room, budget, and clearance. Recommend strictly from ELIGIBLE CATALOG only. Never invent a product, price, dimension, material, availability, delivery date, or policy. Return up to three products, and only product IDs present in the eligible catalog. Be concise, in Spanish. ELIGIBLE CATALOG: ${JSON.stringify(eligible)}` },
        { role: 'user', content: `Visitor profile: ${JSON.stringify(profile)}. Their stated priority maps to relevant product types: ${JSON.stringify(priorityTags[profile.priority])}.` },
      ],
    });
    const parsed = JSON.parse(recommendation.output_text || '{}') as { message?: unknown; recommendations?: unknown; availabilityNote?: unknown };
    const eligibleIds = new Set(eligible.map((product) => product.id));
    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations.filter((item): item is { productId: string; reason: string } => typeof item === 'object' && item !== null && typeof (item as { productId?: unknown }).productId === 'string' && eligibleIds.has((item as { productId: string }).productId) && typeof (item as { reason?: unknown }).reason === 'string').slice(0, 3) : [];
    return response.status(200).json({ message: typeof parsed.message === 'string' ? parsed.message : 'Revisa estas piezas elegidas para tu espacio.', recommendations, availabilityNote: typeof parsed.availabilityNote === 'string' ? parsed.availabilityNote : 'La disponibilidad, acabados y fecha de entrega se confirman con el showroom antes de reservar.' });
  } catch {
    return response.status(502).json({ message: 'No pudimos preparar una recomendación ahora.', recommendations: [], availabilityNote: 'La disponibilidad, acabados y fecha de entrega se confirman con el showroom antes de reservar.' });
  }
}
