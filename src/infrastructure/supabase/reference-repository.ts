import type { Category, City } from "@/domain/models";
import type { ReferenceRepository } from "@/repositories";
import type { TypedSupabaseClient } from "./types";
import { check } from "./errors";
import { toCategory, toCity } from "./mappers";

export class SupabaseReferenceRepository implements ReferenceRepository {
  constructor(private readonly db: TypedSupabaseClient) {}

  async listCities(): Promise<City[]> {
    return check(await this.db.from("cities").select("*").order("sort")).map(toCity);
  }

  async listCategories(): Promise<Category[]> {
    return check(await this.db.from("categories").select("*").order("sort")).map(toCategory);
  }
}
