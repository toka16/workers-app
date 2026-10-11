import type { PriceUnit, Service } from "@/domain/models";

export interface ServiceWrite {
  title: string;
  description: string;
  categoryId: number | null;
  priceFrom: number | null;
  priceTo: number | null;
  priceUnit: PriceUnit;
}

export interface ServiceRepository {
  listByWorker(workerId: string): Promise<Service[]>;
  create(workerId: string, input: ServiceWrite): Promise<Service>;
  update(workerId: string, serviceId: string, input: ServiceWrite): Promise<void>;
  delete(workerId: string, serviceId: string): Promise<void>;
  /** Persists the order of `serviceIds` (first = top). */
  reorder(workerId: string, serviceIds: string[]): Promise<void>;
}
