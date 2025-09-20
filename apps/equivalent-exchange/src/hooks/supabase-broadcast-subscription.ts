"use client";

import { createClient } from "@eq-ex/shared/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

interface BroadcastSubscriptionStatus {
  isReady: boolean;
  error: Error | null;
}

interface BroadcastPayload {
  event: "INSERT" | "UPDATE" | "DELETE";
  operation: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record?: any;
  old_record?: any;
}

interface BroadcastSubscriptionOptions {
  callback: (payload: BroadcastPayload) => void;
  topic?: string;
  events?: Array<"INSERT" | "UPDATE" | "DELETE">;
}

/**
 * Hook for subscribing to Supabase Realtime broadcasts for table changes.
 *
 * @param table - The database table to listen for changes on
 * @param options - Configuration options for the subscription
 *
 * @example
 * // Listen to stamps for a specific card
 * useBroadcastSubscription('stamp', {
 *   topic: `card:${cardId}:stamps`,
 *   callback: (payload) => {
 *     console.log('Stamp changed:', payload);
 *   }
 * });
 */
export function useBroadcastSubscription(
  table: string,
  options: BroadcastSubscriptionOptions
): BroadcastSubscriptionStatus {
  const [status, setStatus] = useState<BroadcastSubscriptionStatus>({
    isReady: false,
    error: null,
  });

  const {
    callback,
    topic = `table:${table}`,
    events = ["INSERT", "UPDATE", "DELETE"],
  } = options;

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    async function setupSubscription() {
      try {
        const supabase = createClient();
        await supabase.realtime.setAuth();

        channel = supabase.channel(topic, {
          config: {
            private: true,
          },
        });

        events.forEach((event) => {
          channel!.on("broadcast", { event }, (payload) => {
            const broadcastPayload = payload.payload as BroadcastPayload;

            if (broadcastPayload.table && broadcastPayload.table !== table) {
              return;
            }

            callback(broadcastPayload);
          });
        });

        channel.subscribe((status, err) => {
          setStatus({
            isReady: status === "SUBSCRIBED",
            error: err || null,
          });
        });
      } catch (error) {
        console.error("💥 Broadcast subscription setup error:", error);
        setStatus({
          isReady: false,
          error: error as Error,
        });
      }
    }

    setupSubscription();

    return () => {
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [table, topic, JSON.stringify(events), callback]);

  return status;
}
