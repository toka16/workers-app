import type { AuthRepository } from "./auth-repository";
import type { FileStorage } from "./file-storage";
import type { PortfolioRepository } from "./portfolio-repository";
import type { ReferenceRepository } from "./reference-repository";
import type { ServiceRepository } from "./service-repository";
import type { WorkerRepository } from "./worker-repository";

export type * from "./auth-repository";
export type * from "./file-storage";
export type * from "./portfolio-repository";
export type * from "./reference-repository";
export type * from "./service-repository";
export type * from "./worker-repository";

/** Data repositories are provided together by one database provider. */
export interface DataRepositories {
  workers: WorkerRepository;
  services: ServiceRepository;
  portfolio: PortfolioRepository;
  reference: ReferenceRepository;
}

/** Everything the app talks to. Each part may come from a different provider. */
export interface Repositories extends DataRepositories {
  auth: AuthRepository;
  storage: FileStorage;
}
