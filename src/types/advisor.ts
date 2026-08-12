export type AdvisorSpace = 'sala' | 'comedor' | 'dormitorio' | 'oficina';
export type AdvisorSize = 'compacto' | 'medio' | 'amplio';
export type AdvisorPriority = 'confort' | 'reunir' | 'descansar' | 'trabajar';

export type AdvisorProfile = {
  space: AdvisorSpace | null;
  size: AdvisorSize | null;
  budget: number | null;
  priority: AdvisorPriority | null;
  measurements: string;
  notes: string;
  contextProductId?: string;
};

export type AdvisorRecommendation = { productId: string; reason: string };

export type AdvisorResponse = {
  message: string;
  recommendations: AdvisorRecommendation[];
  availabilityNote: string;
};
