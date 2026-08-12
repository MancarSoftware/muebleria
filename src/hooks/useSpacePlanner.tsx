import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type SpaceItem = {
  productId: string;
  colorName?: string;
  addedAt: number;
};

type SpacePlannerState = {
  items: SpaceItem[];
  add: (productId: string, colorName?: string) => void;
  remove: (productId: string) => void;
  updateColor: (productId: string, colorName: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
};

const storageKey = 'casa-space';
const legacyKey = 'casa-favorites';
const SpacePlannerContext = createContext<SpacePlannerState | null>(null);

function loadSpace(): SpaceItem[] {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as unknown;
    if (Array.isArray(stored)) {
      return stored.flatMap((item) => typeof item === 'string'
        ? [{ productId: item, addedAt: Date.now() }]
        : item && typeof item === 'object' && 'productId' in item && typeof (item as SpaceItem).productId === 'string'
          ? [item as SpaceItem]
          : []);
    }
    const legacyFavorites = JSON.parse(localStorage.getItem(legacyKey) ?? '[]') as unknown;
    return Array.isArray(legacyFavorites) ? legacyFavorites.filter((id): id is string => typeof id === 'string').map((productId) => ({ productId, addedAt: Date.now() })) : [];
  } catch {
    return [];
  }
}

export function SpacePlannerProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SpaceItem[]>(loadSpace);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
    localStorage.setItem(legacyKey, JSON.stringify(items.map((item) => item.productId)));
  }, [items]);

  const value = useMemo<SpacePlannerState>(() => ({
    items,
    add: (productId, colorName) => setItems((current) => {
      const found = current.find((item) => item.productId === productId);
      return found
        ? current.map((item) => item.productId === productId ? { ...item, colorName: colorName ?? item.colorName } : item)
        : [...current, { productId, colorName, addedAt: Date.now() }];
    }),
    remove: (productId) => setItems((current) => current.filter((item) => item.productId !== productId)),
    updateColor: (productId, colorName) => setItems((current) => current.map((item) => item.productId === productId ? { ...item, colorName } : item)),
    clear: () => setItems([]),
    has: (productId) => items.some((item) => item.productId === productId),
  }), [items]);

  return <SpacePlannerContext.Provider value={value}>{children}</SpacePlannerContext.Provider>;
}

export function useSpacePlanner() {
  const planner = useContext(SpacePlannerContext);
  if (!planner) throw new Error('useSpacePlanner must be used inside SpacePlannerProvider.');
  return planner;
}
