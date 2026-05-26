export type BudgetMonth = 'JANUARY' | 'FEBRUARY' | 'MARCH' | 'APRIL' | 'MAY' | 'JUNE' | 'JULY' | 'AUGUST' | 'SEPTEMBER' | 'OCTOBER' | 'NOVEMBER' | 'DECEMBER';

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  limitAmount: number;
  month: BudgetMonth;
  year: number;
  spend?: number;
  remaining?: number;
  percentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetDto {
  categoryId: string;
  limitAmount: number;
  month: BudgetMonth;
  year: number;
}
