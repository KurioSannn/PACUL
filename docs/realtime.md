# Supabase Realtime — Negotiation Chat

Pacul uses Supabase Realtime so industry and collector users can see negotiation messages as they are inserted. The backend exposes REST endpoints for sending messages; clients subscribe to Realtime channels for live updates.

## Channel naming convention

Each negotiation thread maps to one Realtime channel:

```txt
negotiation:{threadId}
```

Example for thread `a1b2c3d4-e5f6-7890-abcd-ef1234567890`:

```txt
negotiation:a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

Use `getChannelName(threadId)` from `backend/src/modules/realtime/channel-auth.ts` (also re-exported from `negotiation-channel.ts`) to build channel names consistently.

**Never subscribe to a channel without verifying membership first.** Unknown channel prefixes are rejected by the backend authorization layer.

## Security flow (required)

1. **Authenticate** — obtain a Supabase access token via the normal login flow.
2. **Verify membership** — before subscribing, call `POST /realtime/channel-auth` with `{ "channelName": "negotiation:{threadId}" }` or confirm access via `GET /negotiations/:id` (party-only; non-parties get `404`).
3. **Subscribe only when authorized** — if `authorized` is `false`, do not open the Realtime channel. Show a user-facing error such as “You do not have access to this negotiation.”
4. **Use the user JWT** — pass the returned token (or the same Bearer token from login) when creating the Supabase client so RLS policies on `negotiation_messages` apply.
5. **Handle errors** — treat subscription failures, channel errors, and empty payloads as non-fatal UI states; offer retry and fall back to REST polling via `GET /negotiations/:id/messages`.

### Channel authorization endpoint

```http
POST /realtime/channel-auth
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{ "channelName": "negotiation:a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
```

**Authorized response**

```json
{
  "success": true,
  "data": {
    "authorized": true,
    "token": "<same supabase access jwt>"
  }
}
```

**Unauthorized response**

```json
{
  "success": true,
  "data": {
    "authorized": false
  }
}
```

`authorizeChannelAccess(channelName, userId)` parses `negotiation:{threadId}` and checks `negotiation_threads` party membership (`industry_id` or `collector_id`). Any other channel name returns `authorized: false`.

## What to listen for

Subscribe to **INSERT** events on `negotiation_messages` filtered by `thread_id`:

| Event | Table | Action | Purpose |
|-------|-------|--------|---------|
| New chat line | `negotiation_messages` | `INSERT` | Text, offer, counter-offer, system, accepted, cancelled messages |

Offer and counter-offer rows are also written through `POST /negotiations/:id/offers`; those inserts appear on the same channel.

## Authorization rules

Only negotiation parties may access a channel:

- `industry_id` on the thread (industry buyer)
- `collector_id` on the thread (collector seller)

`ChannelAuthService.authorizeChannelAccess()` and `NegotiationChannelAccess.verifyChannelAccess()` enforce the same rule as REST: non-parties must not subscribe.

REST endpoints enforce the same rule: non-parties receive `404 NEGOTIATION_THREAD_NOT_FOUND`.

## Presence payload (optional)

If the frontend uses Realtime presence on negotiation channels, use this payload shape:

```json
{
  "userId": "uuid",
  "role": "industry",
  "displayName": "PT Contoh Industri",
  "online_at": "2026-06-22T10:00:00.000Z"
}
```

Build it with `ChannelAuthService.buildPresencePayload(userId, role, displayName)`.

## Subscribe example (client reference)

This is a reference pattern only. Subscription is implemented in the frontend, not in this backend repo.

```typescript
import { createClient } from '@supabase/supabase-js';
import { getChannelName } from '@/lib/negotiation-channel'; // mirror backend helper

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function subscribeToNegotiation(threadId: string, accessToken: string) {
  const channelName = getChannelName(threadId);

  const authResponse = await fetch('/api/realtime/channel-auth', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channelName }),
  });

  const authPayload = await authResponse.json();
  const { authorized, token } = authPayload.data ?? {};

  if (!authorized || !token) {
    throw new Error('Not authorized for this negotiation channel');
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const channel = userClient
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'negotiation_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => {
        // payload.new is the inserted NegotiationMessage row
      },
    )
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || err) {
        // surface retry / fallback to REST
      }
    });

  return () => {
    void userClient.removeChannel(channel);
  };
}
```

## Supabase project setup

1. Enable Realtime for `negotiation_messages` in the Supabase dashboard (Database → Replication).
2. Apply migration `016_rls_policies.sql` so authenticated users can only `SELECT` messages for threads they belong to.
3. Use the user's Supabase JWT when subscribing so RLS policies apply on the client.

## Related REST endpoints

See [API.md](./backend/API.md#realtime-channel-authorization) for `POST /realtime/channel-auth` and [API.md](./backend/API.md#negotiation-chat) for negotiation REST endpoints:

- Starting negotiation on an order
- Sending text messages (`POST /negotiations/:id/messages` triggers Realtime INSERT)
- Offers, accept, cancel, and message history
