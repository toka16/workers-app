import type { Service } from "@/domain/models";
import type { ServiceRepository, ServiceWrite } from "@/repositories";
import type { TypedSupabaseClient } from "./types";
import { check, checkOk } from "./errors";
import { toService } from "./mappers";

const toRow = (input: ServiceWrite) => ({
  title: input.title,
  description: input.description,
  category_id: input.categoryId,
  price_from: input.priceFrom,
  price_to: input.priceTo,
  price_unit: input.priceUnit,
});

export class SupabaseServiceRepository implements ServiceRepository {
  constructor(private readonly db: TypedSupabaseClient) {}

  async listByWorker(workerId: string): Promise<Service[]> {
    const rows = check(
      await this.db.from("worker_services").select("*").eq("worker_id", workerId).order("sort").order("created_at"),
    );
    return rows.map(toService);
  }

  async create(workerId: string, input: ServiceWrite): Promise<Service> {
    const last = check(
      await this.db
        .from("worker_services")
        .select("sort")
        .eq("worker_id", workerId)
        .order("sort", { ascending: false })
        .limit(1),
    );
    const row = check(
      await this.db
        .from("worker_services")
        .insert({ ...toRow(input), worker_id: workerId, sort: (last[0]?.sort ?? -1) + 1 })
        .select("*")
        .single(),
    );
    return toService(row);
  }

  async update(workerId: string, serviceId: string, input: ServiceWrite): Promise<void> {
    checkOk(await this.db.from("worker_services").update(toRow(input)).eq("id", serviceId).eq("worker_id", workerId));
  }

  async delete(workerId: string, serviceId: string): Promise<void> {
    checkOk(await this.db.from("worker_services").delete().eq("id", serviceId).eq("worker_id", workerId));
  }

  async reorder(workerId: string, serviceIds: string[]): Promise<void> {
    await Promise.all(
      serviceIds.map(async (id, sort) =>
        checkOk(await this.db.from("worker_services").update({ sort }).eq("id", id).eq("worker_id", workerId)),
      ),
    );
  }
}
