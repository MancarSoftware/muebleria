// Vercel serverless function. Keep OPENAI_API_KEY only in the deployment environment.
import OpenAI from 'openai';
import { products } from '../src/data/products';

export default async function handler(req: { method?: string; body?: { query?: string } }, res: { status: (n: number) => { json: (v: unknown) => void } }) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const query = req.body?.query?.trim();
  if (!query) return res.status(400).json({ message: 'Describe what you need.' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ message: 'AI service is not configured.' });
  const catalog = products.map(({ id, name, category, price, materials, dimensions, colors, tags }) => ({ id, name, category, price, materials, dimensions, colors, tags }));
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: 'gpt-4.1-mini', temperature: 0.15,
    messages: [
      { role: 'system', content: `You are a furniture catalog guide. Reply in Spanish JSON only: {"message":string,"productIds":string[]}. Recommend only IDs in this catalog; do not invent products or availability. If no match, return an empty array and explain concisely. Catalog: ${JSON.stringify(catalog)}` },
      { role: 'user', content: query }
    ], response_format: { type: 'json_object' }
  });
  try { const result = JSON.parse(completion.choices[0]?.message.content || '{}'); const validIds = new Set(products.map(p => p.id)); return res.status(200).json({ message: String(result.message || ''), productIds: Array.isArray(result.productIds) ? result.productIds.filter((id: unknown) => typeof id === 'string' && validIds.has(id)) : [] }); }
  catch { return res.status(502).json({ message: 'The recommendation could not be read.', productIds: [] }); }
}
