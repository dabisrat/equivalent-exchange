"use client";
import { createClient } from "@eq-ex/app/utils/supabase/client";
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
    const supabase = createClient(); // Make sure this is your client creation function

    try {
      channel = supabase
        .channel(table === "*" ? "public" : `public:${table}`)
        .on(
          REALTIME_LISTEN_TYPES.POSTGRES_CHANGES as any,
          {
            schema: 'public',
            table,
            event,
            filter,
          },
          callback
        )
        .subscribe((status, err) => {
          console.log('📡 Realtime subscription status:', status, 'Error:', err);

          setStatus({
            isReady: status === 'SUBSCRIBED',
            error: err || null
          });
        });
    } catch (error) {
      console.error('💥 Realtime subscription setup error:', error);
      setStatus({
        isReady: false,
        error: error as Error
      });
    }

    return () => {
      if (channel) {
        console.log('🧹 Cleaning up realtime subscription for:', table);
        channel.unsubscribe();
      }
    };
  }, [table, filter, event, callback]);

  return status;
}
