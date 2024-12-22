"use client";
import { createClient } from "@PNN/utils/supabase/client";
import {
  REALTIME_LISTEN_TYPES,
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const defaultCB = (payload: any) => {
  console.log(["Received realtime event", payload]);
};

const supabaseClient = createClient();

export function useSupabaseRealtimeSubscription(
  callback: (param: RealtimePostgresChangesPayload<any>) => void = defaultCB,
  table: string,
  filter: string
) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const channel = supabaseClient
      .channel(table === "*" ? "public" : `public:${table}`)
      .on("system" as any, {} as any, (payload: any) => {
        if (payload.extension == "postgres_changes" && payload.status == "ok") {
          console.log("Channel is ready");
          setIsReady(true);
        }
      })
      .on(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          schema: "public",
          table,
          event: '*',
          filter,
        } as RealtimePostgresChangesFilter<"*">,
        (payload) => {
          callback(payload);
        }
      ).subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [supabaseClient]);
  

  return  isReady ;
}
