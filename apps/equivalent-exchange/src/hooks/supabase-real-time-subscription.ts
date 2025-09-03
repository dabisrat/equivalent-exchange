"use client";
import { createBrowserClient } from "@eq-ex/shared";
import {
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

interface SubscriptionStatus {
  isReady: boolean;
  error: Error | null;
}

type SubscriptionOptions = {
  callback?: (payload: RealtimePostgresChangesPayload<any>) => void;
  filter?: string;
  event?: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT;
};

export function useSupabaseRealtimeSubscription(
  table: string,
  options: SubscriptionOptions = {}
): SubscriptionStatus {
  const [status, setStatus] = useState<SubscriptionStatus>({
    isReady: false,
    error: null,
  });

  const defaultCallback = useCallback(
    (payload: RealtimePostgresChangesPayload<any>) => {},
    [table]
  );

  const {
    callback = defaultCallback,
    filter = "",
    event = REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL,
  } = options;

  useEffect(() => {
    let channel: RealtimeChannel;
    const supabase = createBrowserClient(); // Make sure this is your client creation function

    try {
      console.log("Setting up Realtime subscription...");
      channel = supabase
        .channel(table === "*" ? "public" : `public:${table}`)
        .on(
          REALTIME_LISTEN_TYPES.POSTGRES_CHANGES as any,
          {
            schema: "public",
            table,
            event,
            filter,
          },
          callback
        )
        .subscribe((status, err) => {
          console.log("Subscription status:", status);
          setStatus({
            isReady: status === "SUBSCRIBED",
            error: err || null,
          });
        });
    } catch (error) {
      console.error("💥 Realtime subscription setup error:", error);
      setStatus({
        isReady: false,
        error: error as Error,
      });
    }

    return () => {
      if (channel) {
        console.log("Unsubscribing from Realtime channel...");
        channel.unsubscribe();
      }
    };
  }, [table, filter, event, callback]);

  return status;
}
