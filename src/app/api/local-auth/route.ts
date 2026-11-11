import { cookies } from "next/headers";
import { authenticate, revokeCurrentSession, SESSION_COOKIE } from "@/lib/server/dashboard-auth";
import { assertSameOrigin, isLocalMode } from "@/lib/server/local-session";
import { localError } from "@/lib/server/local-api";
import { HttpError, objectValue, textValue } from "@/lib/server/validation";
export async function POST(request: Request): Promise<Response> {
 try {
  if (!isLocalMode()) throw new HttpError(404,"Login lokal tidak aktif.");
  assertSameOrigin(request);
  const body=objectValue(await request.json().catch(()=>null));
  const token=await authenticate(textValue(body.email,"Email",160),textValue(body.password,"Kata sandi",128));
  (await cookies()).set(SESSION_COOKIE,token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:8*3600});
  return Response.json({ok:true});
 } catch(error) { return localError(error); }
}
export async function DELETE(request: Request): Promise<Response> {
 try { assertSameOrigin(request); await revokeCurrentSession(); (await cookies()).delete(SESSION_COOKIE); return Response.json({ok:true}); } catch(error) { return localError(error); }
}
