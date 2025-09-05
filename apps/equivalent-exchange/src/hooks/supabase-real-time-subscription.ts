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

  const supabase = createBrowserClient();

  useEffect(() => {
    let channel: RealtimeChannel;
    console.log("Setting up Realtime subscription...", "use efftect ran");
    try {
      channel = supabase
        .channel(`test-channel-${table}`)
        .on(
          "postgres_changes" as any,
          {
            schema: "public",
            event: "*",
            table,
            filter,
          },
          callback
        )
        .on("system", {}, (payload) => {
          console.log("System event:", payload);
        })
        .subscribe((status, err) => {
          console.log("Subscription status:", status, err);
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
      console.log("use effect cleanup");
      if (channel) {
        console.log("Unsubscribing from Realtime channel...");
        supabase.removeChannel(channel);
      }
    };
  }, [table, filter, event, callback, supabase]);

  return status;
}
