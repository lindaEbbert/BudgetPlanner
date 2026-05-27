export type TransactionType = 'INCOME' | 'EXPENSE' | 'INITIAL';

export interface Transaction {
  id: string;
  userId: string;
  categoryId?: string;
  fixedCostId?: string;
  name: string;
  amount: number;
  type: TransactionType;
  transactionDate: string;
  description?: string;
  isVoided: boolean;
  createdAt: string;
}

export interface CreateTransactionDto {
  name: string;
  amount: number;
  type: TransactionType;
  categoryId?: string;
  transactionDate: string;
  description?: string;
}

export interface BalanceSummary {
  income: number;
  expense: number;
  initialBalance: number;
  balance: number;
}
