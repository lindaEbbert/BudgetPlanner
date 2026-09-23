import { TransactionType } from './transaction.model';

export interface SuggestCategoryDto {
  name: string;
  description?: string;
  type: TransactionType;
}

// At most one field is set; both null means there is no suggestion.
export interface CategorySuggestion {
  categoryId: string | null;
  newCategoryName: string | null;
}
