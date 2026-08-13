import type { Product } from '../types/catalog';

type ProductSize = { widthCm: number; depthCm: number };

export type SpaceRequirement = {
  productId: string;
  name: string;
  widthCm: number;
  depthCm: number;
  clearanceCm: number;
  footprintSqm: number;
  recommendedSqm: number;
};

export type SpaceEstimate = {
  furnitureFootprintSqm: number;
  requiredAreaSqm: number;
  roomAreaSqm: number | null;
  fitsArea: boolean | null;
  itemsThatDoNotFit: string[];
  requirements: SpaceRequirement[];
};

const fallbackSizes: Record<string, ProductSize> = {
  'sofás': { widthCm: 220, depthCm: 95 },
  camas: { widthCm: 160, depthCm: 200 },
  'mesas de comedor': { widthCm: 180, depthCm: 95 },
  sillas: { widthCm: 55, depthCm: 58 },
  'mesas de centro': { widthCm: 120, depthCm: 70 },
  oficina: { widthCm: 140, depthCm: 65 },
  decoración: { widthCm: 50, depthCm: 50 },
};

const clearanceByCategory: Record<string, number> = {
  'sofás': 75,
  camas: 70,
  'mesas de comedor': 90,
  sillas: 60,
  'mesas de centro': 50,
  oficina: 80,
  decoración: 35,
};

function parseDimensions(dimensions: string): ProductSize | null {
  const values = dimensions.replace(',', '.').match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (values.length < 2) return null;

  const usesMetres = /(?:^|\s)m(?:\s|$)/i.test(dimensions) && !/cm/i.test(dimensions);
  const multiplier = usesMetres ? 100 : 1;
  return { widthCm: values[0] * multiplier, depthCm: values[1] * multiplier };
}

function getRequirement(product: Product): SpaceRequirement {
  const category = product.category.toLocaleLowerCase('es');
  const size = parseDimensions(product.dimensions) ?? fallbackSizes[category] ?? { widthCm: 100, depthCm: 70 };
  const clearanceCm = clearanceByCategory[category] ?? 60;
  const footprintSqm = (size.widthCm * size.depthCm) / 10_000;
  // This is intentionally conservative: it reserves a passage on every side so a
  // salesperson never presents an exact architectural plan based only on a web form.
  const recommendedSqm = ((size.widthCm + clearanceCm * 2) * (size.depthCm + clearanceCm * 2)) / 10_000;

  return {
    productId: product.id,
    name: product.name,
    ...size,
    clearanceCm,
    footprintSqm,
    recommendedSqm,
  };
}

export function estimateSpace(products: Product[], widthMetres?: number | null, depthMetres?: number | null): SpaceEstimate {
  const requirements = products.map(getRequirement);
  const roomAreaSqm = widthMetres && depthMetres && widthMetres > 0 && depthMetres > 0 ? widthMetres * depthMetres : null;
  const roomWidthCm = widthMetres ? widthMetres * 100 : null;
  const roomDepthCm = depthMetres ? depthMetres * 100 : null;
  const itemsThatDoNotFit = roomWidthCm && roomDepthCm ? requirements
    .filter((item) => {
      const neededWidth = item.widthCm + item.clearanceCm * 2;
      const neededDepth = item.depthCm + item.clearanceCm * 2;
      return !((neededWidth <= roomWidthCm && neededDepth <= roomDepthCm) || (neededDepth <= roomWidthCm && neededWidth <= roomDepthCm));
    })
    .map((item) => item.name) : [];

  const furnitureFootprintSqm = requirements.reduce((total, item) => total + item.footprintSqm, 0);
  const requiredAreaSqm = requirements.reduce((total, item) => total + item.recommendedSqm, 0);

  return {
    furnitureFootprintSqm,
    requiredAreaSqm,
    roomAreaSqm,
    fitsArea: roomAreaSqm === null ? null : roomAreaSqm >= requiredAreaSqm && itemsThatDoNotFit.length === 0,
    itemsThatDoNotFit,
    requirements,
  };
}
