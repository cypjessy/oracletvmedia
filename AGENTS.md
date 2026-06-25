<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Summary

### Goal
Make the admin radio page fully dynamic by wiring all tabs to the real AzuraCast API and adding a unified Play Control center. Then make the admin video page use real YouTube API data stored in Firestore.

### Done (Radio)
- Play Control center built and integrated into Overview tab (separate "Play Control" tab removed)
- Schedule mode: lists real scheduled playlists with toggle switches
- Playlist mode: lists real unscheduled playlists with "Play" button that disables all others and enables selected
- Single Track mode: lists real media files; creates/reuses `__single__` playlist, adds file, activates it
- `getQueue()` API function added — fetches upcoming queue from `GET /api/station/1/queue`
- `QueueItem` type added to `azuracast.ts`
- Now Playing indicator bar shows in all three modes with track name when a single track is playing
- Overview polling fixed: each API call has its own `.catch()` fallback so one failure doesn't drop all state updates
- `togglePlaylistEnabled` fixed: follows up toggle PUT with a GET because the toggle endpoint only returns `{"success": true}`
- Loading spinners (`fa-spinner fa-spin`) added to Play Control buttons (playlist play, schedule toggle, single track play)
- `pcActionLoading` state added — prevents double-clicks and shows spinner on the active button
- Shared per-tab loading states (`plActionLoading`, `djActionLoading`, `whActionLoading`, `mediaActionLoading`) added for Playlists, DJs, Webhooks, and Media tabs
- Loading spinners added to all action buttons across all tabs (create, delete, toggle, edit, save, bulk actions)
- `toggleAutoDJ` fallback: backend POST returns 405, so it now disables all enabled playlists (pause) or restores previously-saved enabled playlists (resume) via module-level `_savedEnabledPlaylistIds`

### Done (Video)
- Firestore collections `youtube_channel`, `youtube_videos`, `youtube_series` created via `src/lib/youtube.ts`
- `POST /api/youtube/sync` server route fetches from YouTube Data API (channel info + all uploaded videos with duration) and returns data — no database writes on server (saves quota)
- **Connect** flow: calls sync API → saves channel + videos to Firestore via batch write → shows real channel name, avatar, subscriber count
- **Sync Now** re-fetches from YouTube API and overwrites Firestore data (keeps `isFeatured`, `isHidden`, `seriesId`, `category` edits via `merge: true`)
- Video **Edit** saves `title`, `description`, `category`, `series`, `featured`, `hidden`, `tags` to Firestore
- Video **Delete** removes from Firestore and removes from all series
- Series **Create/Delete** writes to Firestore
- Series **Add/Remove Video** updates `videoIds` array in Firestore
- All data served from Firestore — no YouTube API calls on page load
- Loading spinners and error toasts for all async operations
- Category auto-detection from YouTube categories or title/description keywords

### Key Decisions
- Play Control embedded in Overview tab for faster access (single pane) instead of a separate tab
- Single Track mode uses a `__single__` jingle playlist to queue individual songs (AzuraCast request API disabled, no direct "play this song" endpoint)
- `togglePlaylistEnabled` does two-step (toggle + re-fetch) because `PUT /api/station/1/playlist/{id}/toggle` returns `{"success": true}` not the playlist object
- Overview polling uses individual `.catch()` per promise instead of `Promise.all` catch to prevent one failed API call from blocking all state updates
- Loading spinners use per-action/global-per-tab state rather than individual booleans per button to keep code manageable
- YouTube sync uses server-side API key (env `YOUTUBE_API_KEY`, not public) with client writing to Firestore — no `firebase-admin` dependency needed
- YouTube Live tab kept as static placeholder (requires OAuth scopes, not just API key)

### Critical Context
- `PUT /api/station/1/playlist/{id}/toggle` returns `{"success": true, "message": "Playlist enabled."}` — **not** the playlist object. Must re-fetch via `GET /api/station/1/playlist/{id}`
- `POST /api/station/1/backend` returns `HTTP 405` (method not allowed) — `toggleAutoDJ` and `toggleStationLive` silently fail
- `enable_requests: false` — song request endpoint (`POST /api/station/1/request/{mediaId}`) returns 400
- `GET /api/station/1/queue` works and returns upcoming song queue array
- The `default` playlist has schedule `days=[0,0]` (Sun) and an `__single__` jingle playlist exists
- AzuraCast schedule API bug: `days: [0]` → `[]` (single Sunday), use `[0, 0]` as workaround
- Station settings: only `name` and `enable_public_page` are savable via the admin API
- Only one media file exists on the station ("Test Title" by "Test Artist")
- YouTube sync endpoint fetches via uploads playlist (`UU{channelId}`) and batches video details in groups of 50 — uses `playlistItems` for pagination (max 500 videos)
- Firestore writes use `writeBatch` for atomic saves and `serverTimestamp()` for sync tracking
- Firestore security rules must allow read/write for `youtube_channel`, `youtube_videos`, `youtube_series` collections for authenticated admin users

### Relevant Files
- `src/lib/azuracast.ts`: contains `getQueue`, `togglePlaylistEnabled` (now re-fetches after toggle), `QueueItem` type, `mapPlaylist` (dedup days), `getNowPlaying`, `getStationStatus`, `getSongHistory`, `getStationSourceInfo` (fetches Icecast source password/port from `/admin/station/{id}`), `StationSourceInfo` type
- `src/app/admin/radio/page.tsx`: Admin radio page — Play Control integrated into Overview, loading spinners on all action buttons, shared per-tab loading states, Go Live tab now shows real Icecast source URL, mount, username (`source`), and fetched source password when broadcasting
- `src/app/api/youtube/sync/route.ts`: Server-side YouTube sync — fetches channel + playlistItems + videos from YouTube Data API, returns `{ channel, videos }`
- `src/lib/youtube.ts`: Firestore helpers for `youtube_channel`, `youtube_videos`, `youtube_series` collections — `getVideos`, `saveVideos`, `updateVideo`, `deleteVideo`, `getChannel`, `saveChannel`, `getSeries`, `createSeries`, `updateSeries`, `deleteSeries`
- `src/app/admin/video/page.tsx`: Admin video page — real Firestore data (channel info, video library, series management), sync-on-connect flow, all CRUD wired to Firestore, `openSeriesSafe` helper for optional series IDs
