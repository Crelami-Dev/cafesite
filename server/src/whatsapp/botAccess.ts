export type BotDecision =
  | { kind: "ignore" }
  | { kind: "enabled" | "disabled" }
  | { kind: "message"; text: string; token: object };

interface Conversation { expiresAt: number; token: object; reminded: boolean; }
const DEDUP_MS = 60 * 60_000;

/** Session state is intentionally in memory: no personal chat history is retained. */
export class BotAccess {
  private readonly conversations = new Map<string, Conversation>();
  private readonly seen = new Map<string, number>();
  constructor(private readonly idleMs: number, private readonly reminderMs: number, private readonly onClose: (from: string) => void = () => undefined) {}

  accept(from: string, id: string, body: string, now = Date.now()): BotDecision {
    if (!id || (this.seen.get(`${from}:${id}`) ?? 0) > now) return { kind: "ignore" };
    this.seen.set(`${from}:${id}`, now + DEDUP_MS);
    const text = body.trim();
    const existing = this.conversations.get(from);
    if (existing && existing.expiresAt <= now) { this.conversations.delete(from); this.onClose(from); }
    if (/^(tutup bot|@tutup)$/i.test(text)) { this.conversations.delete(from); this.onClose(from); return { kind: "disabled" }; }
    if (/^halo bot[!. ]*$/i.test(text)) { this.conversations.set(from, { expiresAt: now + this.idleMs, token: existing?.token ?? {}, reminded: false }); return { kind: "enabled" }; }
    const session = this.conversations.get(from);
    if (!session) return { kind: "ignore" };
    session.expiresAt = now + this.idleMs;
    session.reminded = false;
    return text ? { kind: "message", text, token: session.token } : { kind: "ignore" };
  }

  canReply(from: string, token: object, now = Date.now()): boolean { const session = this.conversations.get(from); return session?.token === token && session.expiresAt > now; }
  dueReminders(now = Date.now()): string[] { const due: string[] = []; for (const [from, session] of this.conversations) if (!session.reminded && session.expiresAt - now <= this.idleMs - this.reminderMs && session.expiresAt > now) { session.reminded = true; due.push(from); } return due; }
  prune(now = Date.now()): void { for (const [key, expiry] of this.seen) if (expiry <= now) this.seen.delete(key); for (const [from, session] of this.conversations) if (session.expiresAt <= now) { this.conversations.delete(from); this.onClose(from); } }
}
