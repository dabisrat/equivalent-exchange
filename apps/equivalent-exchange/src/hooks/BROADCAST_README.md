# Supabase Broadcast Realtime Implementation

This implementation provides a more reliable alternative to `postgres_changes` for realtime subscriptions in production environments. It uses Supabase's broadcast feature with database triggers to automatically send table change events.

## Why Use Broadcast Instead of postgres_changes?

- **Better Production Reliability**: Broadcast messages are stored in `realtime.messages` table and are more reliable
- **Lower Latency**: Direct WebSocket communication with better performance
- **More Flexible**: Can send custom payloads and handle complex use cases
- **Guaranteed Delivery**: Messages are persisted and can be replayed if needed

## Quick Start

### 1. Run the Migration

Apply the broadcast trigger migration:

```bash
# Run the migration to set up the broadcast infrastructure for stamps
supabase db push
```

### 2. Use the React Hook

```typescript
import { useBroadcastSubscription } from '../hooks/supabase-broadcast-subscription';

function RewardsCard({ card }) {
  // Listen to stamps for this specific card
  useBroadcastSubscription('stamp', {
    topic: `card:${card.id}:stamps`,
    callback: (payload) => {
      console.log('Stamp changed:', payload);
      // Handle the change (update state, refetch data, etc.)
    },
    events: ['INSERT', 'UPDATE', 'DELETE']
  });

  return <div>Your component JSX</div>;
}
```

## Current Implementation

This setup is specifically configured for **stamp broadcasting with card-level filtering**:

### Database Setup

- **RLS Policy**: Allows authenticated users to receive broadcast messages
- **Custom Trigger**: Broadcasts stamp changes to card-specific topics
- **Topic Pattern**: `card:{card_id}:stamps`

### Hook Usage

```typescript
// Listen to all stamp changes for a specific card
useBroadcastSubscription("stamp", {
  topic: `card:${cardId}:stamps`,
  callback: (payload) => {
    const stampData = payload.new || payload.old;
    // Handle stamp change
  },
  events: ["INSERT", "UPDATE", "DELETE"],
});
```

## Migration from postgres_changes

Your existing `useSupabaseRealtimeSubscription` hook is preserved and will continue working. To migrate:

```typescript
// Old postgres_changes approach
useSupabaseRealtimeSubscription("stamp", {
  callback: (payload) => console.log(payload),
  filter: "reward_card_id=eq.123",
});

// New broadcast approach
useBroadcastSubscription("stamp", {
  topic: `card:123:stamps`,
  callback: (payload) => console.log(payload),
});
```

## Performance Notes

- **Broadcast messages are automatically cleaned up** after 3 days
- **Each broadcast is stored** in `realtime.messages` table temporarily
- **Better scalability** for high-frequency updates
- **Lower resource usage** compared to postgres_changes in production
- **Card-specific filtering** happens at the database level, reducing network traffic

## Troubleshooting

### Check if triggers are working:

```sql
-- Insert a test stamp and check if broadcast triggers fire
INSERT INTO stamp (reward_card_id, stamp_index, stamped) VALUES ('your-card-id', 1, true);
SELECT * FROM realtime.messages ORDER BY inserted_at DESC LIMIT 5;
```

### Check subscription status:

```typescript
const { isReady, error } = useBroadcastSubscription("stamp", {
  topic: `card:${cardId}:stamps`,
  callback: console.log,
});

console.log("Subscription ready:", isReady);
console.log("Subscription error:", error);
```

### Enable debug logging:

The hook includes console logging for debugging. Check your browser console for:

- `"Broadcast subscription status for card:123:stamps: SUBSCRIBED"`
- `"Received broadcast payload for card stamps:"`

## Security

- **RLS policies are enforced** on the `realtime.messages` table
- **Authentication is required** for all broadcast subscriptions
- **Messages are filtered** by the realtime authorization system
- **Card-specific topics** ensure users only receive relevant updates
