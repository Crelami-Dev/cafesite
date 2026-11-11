"use client";

import { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PublicContent, PublicContentProviderProps } from "@/types";
import { CONTENT_SYNC_CHANNEL, CONTENT_SYNC_STORAGE_KEY } from "@/components/admin/admin-api";

const PublicContentContext = createContext<PublicContent | null>(null);

export function PublicContentProvider({ data, children }: PublicContentProviderProps): React.JSX.Element {
  const router = useRouter();

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CONTENT_SYNC_CHANNEL);
      channel.onmessage = () => {
        router.refresh();
      };
    } catch {
      channel = null;
    }

    const onStorage = (event: StorageEvent): void => {
      if (event.key === CONTENT_SYNC_STORAGE_KEY) {
        router.refresh();
      }
    };

    const onVisibility = (): void => {
      if (!document.hidden) {
        router.refresh();
      }
    };

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      channel?.close();
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return <PublicContentContext.Provider value={data}>{children}</PublicContentContext.Provider>;
}

export function usePublicContent(): PublicContent {
  const content = useContext(PublicContentContext);
  if (!content) throw new Error("PublicContentProvider diperlukan.");
  return content;
}
