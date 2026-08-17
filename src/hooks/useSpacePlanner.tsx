import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const spaceRoomTypes = ['Sala', 'Comedor', 'Dormitorio', 'Oficina'] as const;
export type SpaceRoomType = typeof spaceRoomTypes[number];

export type SpaceRoom = {
  id: string;
  roomType: SpaceRoomType;
  width: string;
  depth: string;
  budget: string;
  notes: string;
};

export type SpaceItem = {
  productId: string;
  colorName?: string;
  addedAt: number;
  roomId: string;
};

type PersistedSpace = { items: SpaceItem[]; rooms: SpaceRoom[] };

type SpacePlannerState = {
  items: SpaceItem[];
  rooms: SpaceRoom[];
  add: (productId: string, colorName?: string, roomType?: SpaceRoomType) => void;
  remove: (productId: string) => void;
  updateColor: (productId: string, colorName: string) => void;
  assignRoom: (productId: string, roomId: string) => void;
  assignRoomType: (productId: string, roomType: SpaceRoomType) => void;
  addRoom: (roomType?: SpaceRoomType) => void;
  updateRoom: (roomId: string, values: Partial<Omit<SpaceRoom, 'id'>>) => void;
  removeRoom: (roomId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
};

const storageKey = 'casa-space';
const legacyKey = 'casa-favorites';
const SpacePlannerContext = createContext<SpacePlannerState | null>(null);

function roomId() {
  return `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newRoom(roomType: SpaceRoomType = 'Sala'): SpaceRoom {
  return { id: roomId(), roomType, width: '', depth: '', budget: '', notes: '' };
}

function isRoomType(value: unknown): value is SpaceRoomType {
  return typeof value === 'string' && (spaceRoomTypes as readonly string[]).includes(value);
}

function normalizeRoom(value: unknown): SpaceRoom | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<SpaceRoom>;
  if (typeof candidate.id !== 'string' || !isRoomType(candidate.roomType)) return null;
  return {
    id: candidate.id,
    roomType: candidate.roomType,
    width: typeof candidate.width === 'string' ? candidate.width : '',
    depth: typeof candidate.depth === 'string' ? candidate.depth : '',
    budget: typeof candidate.budget === 'string' ? candidate.budget : '',
    notes: typeof candidate.notes === 'string' ? candidate.notes : '',
  };
}

function normalizeItem(value: unknown, fallbackRoomId: string): SpaceItem | null {
  if (typeof value === 'string') return { productId: value, addedAt: Date.now(), roomId: fallbackRoomId };
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<SpaceItem>;
  if (typeof candidate.productId !== 'string') return null;
  return {
    productId: candidate.productId,
    colorName: typeof candidate.colorName === 'string' ? candidate.colorName : undefined,
    addedAt: typeof candidate.addedAt === 'number' ? candidate.addedAt : Date.now(),
    roomId: typeof candidate.roomId === 'string' ? candidate.roomId : fallbackRoomId,
  };
}

function loadSpace(): PersistedSpace {
  const fallbackRoom = newRoom();
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as unknown;
    if (Array.isArray(stored)) {
      return { items: stored.flatMap((item) => {
        const normalized = normalizeItem(item, fallbackRoom.id);
        return normalized ? [normalized] : [];
      }), rooms: [fallbackRoom] };
    }
    if (stored && typeof stored === 'object') {
      const snapshot = stored as Partial<PersistedSpace>;
      const rooms = Array.isArray(snapshot.rooms) ? snapshot.rooms.flatMap((room) => {
        const normalized = normalizeRoom(room);
        return normalized ? [normalized] : [];
      }) : [];
      const activeRooms = rooms.length ? rooms : [fallbackRoom];
      const defaultRoomId = activeRooms[0].id;
      const items = Array.isArray(snapshot.items) ? snapshot.items.flatMap((item) => {
        const normalized = normalizeItem(item, defaultRoomId);
        return normalized ? [{ ...normalized, roomId: activeRooms.some((room) => room.id === normalized.roomId) ? normalized.roomId : defaultRoomId }] : [];
      }) : [];
      return { items, rooms: activeRooms };
    }
    const legacyFavorites = JSON.parse(localStorage.getItem(legacyKey) ?? '[]') as unknown;
    return {
      items: Array.isArray(legacyFavorites) ? legacyFavorites.flatMap((id) => {
        const normalized = normalizeItem(id, fallbackRoom.id);
        return normalized ? [normalized] : [];
      }) : [],
      rooms: [fallbackRoom],
    };
  } catch {
    return { items: [], rooms: [fallbackRoom] };
  }
}

export function roomForProductCategory(category: string): SpaceRoomType {
  const normalized = category.toLocaleLowerCase('es');
  if (normalized.includes('comedor') || normalized.includes('silla')) return 'Comedor';
  if (normalized.includes('cama')) return 'Dormitorio';
  if (normalized.includes('oficina')) return 'Oficina';
  return 'Sala';
}

export function SpacePlannerProvider({ children }: { children: React.ReactNode }) {
  const [space, setSpace] = useState<PersistedSpace>(loadSpace);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(space));
    localStorage.setItem(legacyKey, JSON.stringify(space.items.map((item) => item.productId)));
  }, [space]);

  const value = useMemo<SpacePlannerState>(() => ({
    items: space.items,
    rooms: space.rooms,
    add: (productId, colorName, preferredRoomType = 'Sala') => setSpace((current) => {
      const found = current.items.find((item) => item.productId === productId);
      if (found) {
        return { ...current, items: current.items.map((item) => item.productId === productId ? { ...item, colorName: colorName ?? item.colorName } : item) };
      }
      let rooms = current.rooms;
      let target = rooms.find((room) => room.roomType === preferredRoomType);
      if (!target) {
        const emptyRoom = rooms.find((room) => !current.items.some((item) => item.roomId === room.id));
        if (emptyRoom) {
          target = { ...emptyRoom, roomType: preferredRoomType };
          rooms = rooms.map((room) => room.id === emptyRoom.id ? target! : room);
        } else {
          target = newRoom(preferredRoomType);
          rooms = [...rooms, target];
        }
      }
      return { rooms, items: [...current.items, { productId, colorName, addedAt: Date.now(), roomId: target.id }] };
    }),
    remove: (productId) => setSpace((current) => ({ ...current, items: current.items.filter((item) => item.productId !== productId) })),
    updateColor: (productId, colorName) => setSpace((current) => ({ ...current, items: current.items.map((item) => item.productId === productId ? { ...item, colorName } : item) })),
    assignRoom: (productId, roomId) => setSpace((current) => current.rooms.some((room) => room.id === roomId)
      ? { ...current, items: current.items.map((item) => item.productId === productId ? { ...item, roomId } : item) }
      : current),
    assignRoomType: (productId, roomType) => setSpace((current) => {
      const existingRoom = current.rooms.find((room) => room.roomType === roomType);
      const targetRoom = existingRoom ?? newRoom(roomType);
      const rooms = existingRoom ? current.rooms : [...current.rooms, targetRoom];
      return { rooms, items: current.items.map((item) => item.productId === productId ? { ...item, roomId: targetRoom.id } : item) };
    }),
    addRoom: (roomType = 'Sala') => setSpace((current) => ({ ...current, rooms: [...current.rooms, newRoom(roomType)] })),
    updateRoom: (roomId, values) => setSpace((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === roomId ? { ...room, ...values } : room) })),
    removeRoom: (roomId) => setSpace((current) => {
      if (current.rooms.length < 2 || !current.rooms.some((room) => room.id === roomId)) return current;
      const remainingRooms = current.rooms.filter((room) => room.id !== roomId);
      return { rooms: remainingRooms, items: current.items.map((item) => item.roomId === roomId ? { ...item, roomId: remainingRooms[0].id } : item) };
    }),
    clear: () => setSpace((current) => ({ ...current, items: [] })),
    has: (productId) => space.items.some((item) => item.productId === productId),
  }), [space]);

  return <SpacePlannerContext.Provider value={value}>{children}</SpacePlannerContext.Provider>;
}

export function useSpacePlanner() {
  const planner = useContext(SpacePlannerContext);
  if (!planner) throw new Error('useSpacePlanner must be used inside SpacePlannerProvider.');
  return planner;
}
