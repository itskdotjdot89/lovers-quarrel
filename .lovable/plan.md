
# Friends Feature for Lovers Quarrel

## Overview
Add a private friends list where logged-in users can add people by email or username, manage friend status, and use their list when starting multiplayer sessions.

## Database Changes

### New table: `friend_links`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | default gen_random_uuid() |
| owner_user_id | uuid, NOT NULL | FK to profiles(id) ON DELETE CASCADE |
| friend_user_id | uuid, nullable | FK to profiles(id) ON DELETE SET NULL |
| friend_email | text, nullable | for unregistered invites |
| friend_display_name | text, nullable | snapshot for display |
| status | text, NOT NULL | 'pending', 'linked', 'blocked', 'removed' |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### Constraints
- Partial unique index on `(owner_user_id, friend_user_id)` WHERE `friend_user_id IS NOT NULL`
- Partial unique index on `(owner_user_id, friend_email)` WHERE `friend_email IS NOT NULL`
- CHECK: at least one of `friend_user_id` or `friend_email` is not null

### RLS Policies (all restrictive)
- SELECT: `owner_user_id = auth.uid()`
- INSERT: `owner_user_id = auth.uid()`
- UPDATE: `owner_user_id = auth.uid()`
- DELETE: `owner_user_id = auth.uid()`

### Trigger
- Reuse existing `update_updated_at_column()` trigger on friend_links

### Auto-link trigger
- Database function that fires on new user signup: checks `friend_links` for matching `friend_email`, then sets `friend_user_id` and status to `linked`

## Frontend Changes

### 1. New page: `src/pages/Friends.tsx`
- Requires authentication (redirect to /auth if not logged in)
- Header with back button to /home
- Add Friend section:
  - Toggle between Email / Username input mode
  - Input field + "Add Friend" button
  - Privacy-preserving feedback: always shows neutral success message
- Friends list:
  - Client-side search filter
  - Sort toggle: Recent / A-Z
  - Each friend card shows display name/email, status badge (Linked/Pending/Blocked)
  - Actions: Remove, Block (via dropdown or buttons)
- Empty state with friendly copy

### 2. New hook: `src/hooks/useFriends.ts`
- `useFriends()` - fetches friend list for current user
- `addFriendByEmail(email)` - looks up profile by email, creates friend_link
- `addFriendByUsername(displayName)` - looks up profile by display_name, creates friend_link
- `removeFriend(id)` - updates status to 'removed'
- `blockFriend(id)` - updates status to 'blocked'
- All lookups done via edge function to avoid exposing user data client-side

### 3. Edge function: `supabase/functions/add-friend/index.ts`
- Accepts `{ type: 'email' | 'username', value: string }`
- Server-side lookup of profiles table (service role)
- If match found: insert friend_link with friend_user_id + status='linked'
- If no match (email only): insert with friend_email + status='pending'
- If no match (username): return neutral message (no disclosure)
- Returns generic success response regardless of match

### 4. Route + Navigation
- Add `/friends` route in App.tsx
- Add Friends button on Home page (grid alongside Favorites/Settings)
- Use `Users` icon from lucide-react

### 5. Styling
- Follow existing dark theme with crimson accents
- Glass card style matching Home page
- Status badges: green for Linked, amber for Pending, red for Blocked

## Technical Details

### Privacy safeguards
- The edge function uses service role to look up users, so the client never queries profiles of other users
- All responses are neutral ("Friend added" / "If that user exists, they'll appear when they join")
- No global user search or directory exposed
- RLS ensures only owner can see their friend_links

### File changes summary
1. **Database migration** - Create `friend_links` table, indexes, RLS, auto-link trigger
2. **`supabase/functions/add-friend/index.ts`** - New edge function for privacy-safe friend addition
3. **`src/hooks/useFriends.ts`** - New hook for friend CRUD operations
4. **`src/pages/Friends.tsx`** - New Friends page UI
5. **`src/App.tsx`** - Add /friends route
6. **`src/pages/Home.tsx`** - Add Friends navigation tile
