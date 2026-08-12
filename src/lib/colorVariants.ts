import type { ProductColorVariant } from '../types/catalog';

const namedColors: Record<string, string> = {
  arena: '#D6C4A5',
  blanco: '#F4F1E9',
  'blanco roto': '#E8E1D4',
  cafe: '#704A33',
  'café': '#704A33',
  carbon: '#2B2E2B',
  'carbón': '#2B2E2B',
  crema: '#E7D8BE',
  marfil: '#EEE8D9',
  negro: '#242522',
  nogal: '#70513A',
  'nogal natural': '#72523A',
  oliva: '#68725A',
  piedra: '#AAA294',
  'roble claro': '#B89468',
};

const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function resolveColorHex(name: string, hex?: string) {
  if (hex && /^#[0-9a-f]{6}$/i.test(hex)) return hex.toUpperCase();
  return namedColors[normalized(name)] ?? '#9A958C';
}

export function legacyColorVariants(colors: string[]): ProductColorVariant[] {
  return colors.map((name, index) => ({
    id: `legacy-${normalized(name)}-${index}`,
    name,
    hex: resolveColorHex(name),
    sortOrder: index,
  }));
}

export function productColorVariants(product: { colors: string[]; variants?: ProductColorVariant[] }) {
  return product.variants?.length ? [...product.variants].sort((a, b) => a.sortOrder - b.sortOrder) : legacyColorVariants(product.colors);
}
