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

let initialMessageSkipped = false;
export function useSupabaseRealtimeSubscription(
  callback: (param: RealtimePostgresChangesPayload<any>) => void = defaultCB,
  event: string = "*",
  table: string,
  filter: string
) {
  const supabaseClient = createClient();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const channel = supabaseClient
      .channel(table === "*" ? "public" : `public:${table}`)
      .on(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          schema: "public",
          table,
          event,
          filter,
        } as RealtimePostgresChangesFilter<"*">,
        (payload) => {
          callback(payload);
        }
      )
      .on("system" as any, {} as any, (payload: any) => {
        console.log(payload);
        if (payload.extension == "postgres_changes" && payload.status == "ok") {
          if (!initialMessageSkipped) {
            initialMessageSkipped = true;
            return;
          }
          setIsReady(true);
        }
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  return { isReady };
}
