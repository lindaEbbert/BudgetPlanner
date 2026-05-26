export type IntervalUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface FixedCost {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  description?: string;
  amount: number;
  intervalUnit: IntervalUnit;
  intervalValue: number;
  startDate: string;
  nextDueDate: string;
  is_active: boolean;
}

export interface CreateFixedCostDto {
  name: string;
  description?: string;
  amount: number;
  intervalUnit: IntervalUnit;
  intervalValue: number;
  startDate: string;
}
