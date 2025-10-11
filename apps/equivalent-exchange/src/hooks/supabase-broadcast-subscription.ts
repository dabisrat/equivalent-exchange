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
    let reconnectAttempts = 0;
    const startTime = Date.now();
    let isCleaningUp = false;

    console.log(
      `🔌 [Broadcast] Setting up subscription for table: ${table}, topic: ${topic}`
    );

    async function setupSubscription() {
      try {
        const supabase = createClient();
        console.log(`🔑 [Broadcast] Setting auth for topic: ${topic}`);
        await supabase.realtime.setAuth();

        channel = supabase.channel(topic, {
          config: {
            private: true,
          },
        });

        // Log channel state changes
        channel.on("system", {}, (payload) => {
          const { extension, status: systemStatus } = payload;
          console.log(
            `📡 [Broadcast] System event - topic: ${topic}, extension: ${extension}, status: ${systemStatus}`
          );
        });

        events.forEach((event) => {
          console.log(
            `👂 [Broadcast] Listening for ${event} events on topic: ${topic}`
          );
          channel!.on("broadcast", { event }, (payload) => {
            const broadcastPayload = payload.payload as BroadcastPayload;

            if (broadcastPayload.table && broadcastPayload.table !== table) {
              console.log(
                `⏭️ [Broadcast] Ignoring event for different table: ${broadcastPayload.table} (expected: ${table})`
              );
              return;
            }

            console.log(
              `📨 [Broadcast] Received ${event} event for ${table}:`,
              broadcastPayload
            );
            callback(broadcastPayload);
          });
        });

        channel.subscribe((status, err) => {
          const elapsed = Date.now() - startTime;

          if (err) {
            console.error(
              `❌ [Broadcast] Subscription error for topic: ${topic} after ${elapsed}ms:`,
              err
            );
          }

          if (status === "SUBSCRIBED") {
            console.log(
              `✅ [Broadcast] Successfully subscribed to topic: ${topic} after ${elapsed}ms (attempts: ${reconnectAttempts + 1})`
            );
            reconnectAttempts = 0;
          } else if (status === "CHANNEL_ERROR") {
            reconnectAttempts++;
            console.warn(
              `⚠️ [Broadcast] Channel error for topic: ${topic}, attempt: ${reconnectAttempts}`
            );
          } else if (status === "TIMED_OUT") {
            console.warn(
              `⏱️ [Broadcast] Subscription timed out for topic: ${topic} after ${elapsed}ms`
            );
          } else if (status === "CLOSED") {
            console.log(`🔒 [Broadcast] Channel closed for topic: ${topic}`);
          } else {
            console.log(
              `🔄 [Broadcast] Status change for topic: ${topic} - ${status}`
            );
          }

          setStatus({
            isReady: status === "SUBSCRIBED",
            error: err || null,
          });
        });
      } catch (error) {
        console.error(
          `💥 [Broadcast] Subscription setup error for topic: ${topic}:`,
          error
        );
        setStatus({
          isReady: false,
          error: error as Error,
        });
      }
    }

    setupSubscription();

    // Force reconnection when channel is stale
    async function forceReconnect() {
      if (isCleaningUp) return;

      console.log(
        `🔄 [Broadcast] Force reconnecting channel for topic: ${topic}`
      );

      const supabase = createClient();
      
      // Remove the old channel first
      if (channel) {
        console.log(`🗑️ [Broadcast] Removing old channel for topic: ${topic}`);
        await supabase.removeChannel(channel);
        channel = null;
      }

      // Disconnect and reconnect the realtime connection to ensure fresh state
      console.log(`🔌 [Broadcast] Reconnecting realtime websocket`);
      supabase.realtime.disconnect();
      
      // Wait a moment for clean disconnect
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reconnect
      supabase.realtime.connect();
      
      // Wait for connection to establish before subscribing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Reset state and reconnect
      reconnectAttempts = 0;
      await setupSubscription();
    }

    // Log visibility changes to track tab switching
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        console.log(
          `👁️ [Broadcast] Tab hidden - topic: ${topic}, channel state: ${channel?.state}`
        );
      } else {
        console.log(
          `👁️ [Broadcast] Tab visible - topic: ${topic}, channel state: ${channel?.state}`
        );
        if (channel?.state === "closed" || channel?.state === "errored") {
          console.log(
            `🔄 [Broadcast] Detected stale channel for topic: ${topic}, forcing reconnection`
          );
          await forceReconnect();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCleaningUp = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (channel) {
        console.log(
          `🔌 [Broadcast] Cleaning up subscription for topic: ${topic}, state: ${channel.state}`
        );
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [table, topic, JSON.stringify(events), callback]);

  return status;
}
