import OpenAI from 'openai';
import { products } from '../src/data/products';

type Request = { method?: string; body?: { query?: string; contextProductId?: string } };
type Response = { status: (statusCode: number) => { json: (body: unknown) => void } };

const catalog = products.map(({ id, name, category, price, description, materials, dimensions, colors, tags }) => ({ id, name, category, price, description, materials, dimensions, colors, tags }));
const validIds = new Set(products.map(({ id }) => id));

export default async function handler(request: Request, response: Response) {
  if (request.method !== 'POST') return response.status(405).json({ message: 'Method not allowed.' });

  const query = request.body?.query?.trim();
  if (!query) return response.status(400).json({ message: 'Describe what you need.', productIds: [] });
  if (!process.env.OPENAI_API_KEY) return response.status(503).json({ message: 'AI service is not configured.', productIds: [] });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const recommendation = await client.responses.create({
      model: 'gpt-5.6-luna',
      reasoning: { effort: 'low' },
      text: { format: { type: 'json_schema', name: 'catalog_recommendation', strict: true, schema: {
        type: 'object', additionalProperties: false, required: ['message', 'productIds'], properties: {
          message: { type: 'string', description: 'A concise recommendation in Spanish.' },
          productIds: { type: 'array', items: { type: 'string' }, maxItems: 3 },
        },
      } } },
      input: [
        { role: 'developer', content: `You are Casa Nativa's furniture advisor. Recommend strictly from the supplied catalog. Never invent a product, price, dimension, material, availability, or policy. Return at most three product IDs. Explain the rationale concisely in Spanish and invite the visitor to confirm dimensions and availability with the showroom. Current catalog: ${JSON.stringify(catalog)}` },
        { role: 'user', content: `Visitor request: ${query}\nCurrent product context (if any): ${request.body?.contextProductId || 'none'}` },
      ],
    });
    const parsed = JSON.parse(recommendation.output_text || '{}') as { message?: unknown; productIds?: unknown };
    const productIds = Array.isArray(parsed.productIds) ? parsed.productIds.filter((id): id is string => typeof id === 'string' && validIds.has(id)).slice(0, 3) : [];
    return response.status(200).json({ message: typeof parsed.message === 'string' ? parsed.message : 'Revisa estas piezas del catálogo.', productIds });
  } catch {
    return response.status(502).json({ message: 'No pudimos preparar una recomendación ahora.', productIds: [] });
  }
}
