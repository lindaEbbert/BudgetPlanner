export type IntervalUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface FixedCost {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  description?: string;
  amount: number;
  intervalUnit: IntervalUnit;
  intervalValue: number;
  startDate: string;
  nextDueDate?: string | null;
  isActive: boolean;
}

export interface FixedCostProjection extends FixedCost {
  projectedAmount: number;
}

export interface CreateFixedCostDto {
  name: string;
  description?: string;
  amount: number;
  intervalUnit: IntervalUnit;
  intervalValue: number;
  startDate: string;
  categoryId?: string;
}

export interface ProjectionResponse {
  projections: FixedCostProjection[];
  total: number;
}
