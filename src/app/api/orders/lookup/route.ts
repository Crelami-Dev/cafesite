import { apiError, bodyJson, json } from "@/lib/server/api";
import { customerOrder } from "@/lib/server/customer-orders";
import { assertSameOrigin } from "@/lib/server/local-session";
import { objectValue, HttpError } from "@/lib/server/validation";
import type { Order } from "@/types";
export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const body = await bodyJson(request);
    if (!Array.isArray(body.orders) || body.orders.length > 20)
      throw new HttpError(400, "Maksimal 20 pesanan per permintaan.");
    const unavailable: string[] = [];
    const results = await Promise.all(
      body.orders.map(async (value: unknown): Promise<Order | null> => {
        const entry = objectValue(value);
        if (typeof entry.id !== "string" || typeof entry.token !== "string")
          throw new HttpError(400, "Referensi pesanan tidak valid.");
        try {
          return (await customerOrder(entry.id, entry.token)).order;
        } catch (error) {
          if (error instanceof HttpError && [403, 404].includes(error.status)) {
            unavailable.push(entry.id);
            return null;
          }
          throw error;
        }
      }),
    );
    return json({
      orders: results.filter((order): order is Order => order !== null),
      unavailable,
    });
  } catch (error) {
    return apiError(error);
  }
}
