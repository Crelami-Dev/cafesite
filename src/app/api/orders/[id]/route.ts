import { apiError, bodyJson, json } from "@/lib/server/api";
import { assertSameOrigin } from "@/lib/server/local-session";
import { customerOrder, editCustomerOrder } from "@/lib/server/customer-orders";
import type { OrderRouteContext } from "@/types";
export async function GET(
  request: Request,
  context: OrderRouteContext,
): Promise<Response> {
  try {
    return json(
      await customerOrder(
        (await context.params).id,
        request.headers.get("x-order-token"),
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(
  request: Request,
  context: OrderRouteContext,
): Promise<Response> {
  try {
    assertSameOrigin(request);
    return json(
      await editCustomerOrder(
        (await context.params).id,
        request.headers.get("x-order-token"),
        await bodyJson(request),
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
