import { useSpacePlanner } from './useSpacePlanner';

// Backwards-compatible adapter for existing catalog filters.
export function useFavorites() {
  const planner = useSpacePlanner();
  return {
    ids: planner.items.map((item) => item.productId),
    toggle: (id: string) => planner.has(id) ? planner.remove(id) : planner.add(id),
  };
}
