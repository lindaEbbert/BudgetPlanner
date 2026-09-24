export interface Category {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
  // Create or rename even if a deleted category has the name.
  ignoreDeletedCategory?: boolean;
}

// A deleted category the backend reports when its name is asked for again.
export interface DeletedCategory {
  id: string;
  name: string;
  deletedAt: string;
}
