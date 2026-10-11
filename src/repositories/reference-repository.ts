import type { Category, City } from "@/domain/models";

export interface ReferenceRepository {
  listCities(): Promise<City[]>;
  listCategories(): Promise<Category[]>;
}
