"use client";
import { createClient } from "@PNN/utils/supabase/client";
import {
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  RealtimePostgresChangesPayload,
  RealtimeChannel,
} from "@supabase/supabase-js";
import { useEffect, useState, useCallback } from "react";

interface SubscriptionStatus {
  isReady: boolean;
  error: Error | null;
}

type SubscriptionOptions = {
  callback?: (payload: RealtimePostgresChangesPayload<any>) => void;
  filter?: string;
  event?: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT;
};

const supabaseClient = createClient();

export function useSupabaseRealtimeSubscription(
  table: string,
  options: SubscriptionOptions = {}
): SubscriptionStatus {
  const [status, setStatus] = useState<SubscriptionStatus>({
    isReady: false,
    error: null,
  });

  const defaultCallback = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    console.log(`Received realtime event for table ${table}:`, payload);
  }, [table]);

  const {
    callback = defaultCallback,
    filter = "",
    event = REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL
  } = options;

  useEffect(() => {
    let channel: RealtimeChannel;

    try {
      channel = supabaseClient
        .channel(table === "*" ? "public" : `public:${table}`)
        .on("system", {}, (payload: any) => {
          if (payload.extension == "postgres_changes" && payload.status == "ok") {
            setStatus({ isReady: true, error: null });
          }
        })
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
        .subscribe();
    } catch (error) {
      console.error("Error subscribing to channel:", error);
      setStatus({
        isReady: false,
        error: error instanceof Error ? error : new Error("Unknown error occurred")
      });
    }

    return () => {
      if (channel) {
        void supabaseClient.removeChannel(channel);
      }
    };
  }, [ status.isReady, filter, event]);

  return status;
}
