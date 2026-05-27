export interface Category {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
}
