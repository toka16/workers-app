import type { PortfolioImage } from "@/domain/models";

export interface PortfolioImageWrite {
  path: string;
  thumbPath: string;
  caption: string;
}

export interface PortfolioRepository {
  listByWorker(workerId: string): Promise<PortfolioImage[]>;
  add(workerId: string, image: PortfolioImageWrite): Promise<PortfolioImage>;
  updateCaption(workerId: string, imageId: string, caption: string): Promise<void>;
  /** Deletes the record and returns it so the caller can remove the stored files. */
  delete(workerId: string, imageId: string): Promise<PortfolioImage | null>;
  reorder(workerId: string, imageIds: string[]): Promise<void>;
}
