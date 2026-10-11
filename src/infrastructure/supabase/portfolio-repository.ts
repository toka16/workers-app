import type { PortfolioImage } from "@/domain/models";
import type { PortfolioImageWrite, PortfolioRepository, UrlResolver } from "@/repositories";
import type { TypedSupabaseClient } from "./types";
import { check, checkOk } from "./errors";
import { toPortfolioImage } from "./mappers";

export class SupabasePortfolioRepository implements PortfolioRepository {
  constructor(
    private readonly db: TypedSupabaseClient,
    private readonly resolveUrl: UrlResolver,
  ) {}

  async listByWorker(workerId: string): Promise<PortfolioImage[]> {
    const rows = check(
      await this.db.from("portfolio_images").select("*").eq("worker_id", workerId).order("sort").order("created_at"),
    );
    return rows.map((row) => toPortfolioImage(this.resolveUrl, row));
  }

  async add(workerId: string, image: PortfolioImageWrite): Promise<PortfolioImage> {
    const last = check(
      await this.db
        .from("portfolio_images")
        .select("sort")
        .eq("worker_id", workerId)
        .order("sort", { ascending: false })
        .limit(1),
    );
    const row = check(
      await this.db
        .from("portfolio_images")
        .insert({
          worker_id: workerId,
          path: image.path,
          thumb_path: image.thumbPath,
          caption: image.caption,
          sort: (last[0]?.sort ?? -1) + 1,
        })
        .select("*")
        .single(),
    );
    return toPortfolioImage(this.resolveUrl, row);
  }

  async updateCaption(workerId: string, imageId: string, caption: string): Promise<void> {
    checkOk(await this.db.from("portfolio_images").update({ caption }).eq("id", imageId).eq("worker_id", workerId));
  }

  async delete(workerId: string, imageId: string): Promise<PortfolioImage | null> {
    const rows = check(
      await this.db.from("portfolio_images").delete().eq("id", imageId).eq("worker_id", workerId).select("*"),
    );
    return rows[0] ? toPortfolioImage(this.resolveUrl, rows[0]) : null;
  }

  async reorder(workerId: string, imageIds: string[]): Promise<void> {
    await Promise.all(
      imageIds.map(async (id, sort) =>
        checkOk(await this.db.from("portfolio_images").update({ sort }).eq("id", id).eq("worker_id", workerId)),
      ),
    );
  }
}
