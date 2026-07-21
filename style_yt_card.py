#!/usr/bin/env python3
"""Replace the inline PlyrPlayer on dashboard with a premium styled card."""
with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# Find and replace the inline PlyrPlayer section
old_section_start = '{/* ===== LIVE TV (served from Vercel on APK, direct on web) ===== */}'
old_section_end = '{/* ===== PREMIUM RADIO HERO CARD ===== */}'

start_idx = content.find(old_section_start)
end_idx = content.find(old_section_end)

if start_idx == -1 or end_idx == -1:
    print(f"ERROR: Markers not found. start={start_idx}, end={end_idx}")
    exit(1)

# New premium card section
new_section = """\
      {/* ===== YOUTUBE PLAYER ===== */}
      <section className="feed-section">
        <div className="yt-card">
          <div className="yt-header">
            <div className="yt-header-left">
              <div className="yt-header-icon">
                <i className="fab fa-youtube"></i>
              </div>
              <div className="yt-header-info">
                <div className="yt-header-title">Latest Video</div>
                <div className="yt-header-sub">Watch recent sermons and teachings</div>
              </div>
            </div>
            <button className="yt-header-btn" onClick={() => router.push("/watch")}>
              <i className="fas fa-play"></i> Watch All
            </button>
          </div>
          {recentVideos.length > 0 ? (
            <div className="yt-player-wrap">
              <PlyrPlayer videoId={recentVideos[0].id} onEnded={() => {}} />
            </div>
          ) : (
            <div className="yt-empty">
              <i className="fas fa-video-slash"></i>
              <span>No videos available</span>
            </div>
          )}
        </div>
      </section>
"""

new_content = content[:start_idx] + new_section + content[end_idx:]

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(new_content)

print("SUCCESS: Replaced PlyrPlayer with premium card")

# Now add CSS classes for the new card
# Find the style block and add yt-card CSS
css_start = '.live-tv-embed-section'
# Find where to insert - after the existing card CSS section (after .sc-card section)
insert_after = '/* ===== SERIES CARD — PREMIUM ===== */'

with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# Find the end of the sc-card CSS block to insert after it
sc_card_end = content.find('flex-shrink: 0;', content.find('.sc-card'))
if sc_card_end != -1:
    end_of_line = content.find('\n', sc_card_end)
    
    yt_css = """
        /* ===== YOUTUBE PLAYER CARD — PREMIUM ===== */
        .yt-card {
            border-radius: var(--radius-xl); overflow: hidden;
            background: var(--surface-card);
            border: 1px solid var(--border);
            transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .yt-card:hover { border-color: rgba(232,168,56,0.2); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
        .yt-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 16px;
            border-bottom: 1px solid var(--border);
        }
        .yt-header-left {
            display: flex; align-items: center; gap: 12px;
        }
        .yt-header-icon {
            width: 36px; height: 36px; border-radius: 10px;
            background: rgba(255,0,0,0.1);
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; color: #FF0000;
        }
        .yt-header-info { }
        .yt-header-title { font-size: 15px; font-weight: 700; }
        .yt-header-sub { font-size: 11px; color: var(--text-tertiary); margin-top: 1px; }
        .yt-header-btn {
            padding: 8px 14px; border-radius: 10px;
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            color: #fff; border: none; font-size: 11px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center; gap: 5px;
            transition: all 0.15s ease; white-space: nowrap;
        }
        .yt-header-btn:active { transform: scale(0.95); }
        .yt-player-wrap {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            background: #000;
        }
        .yt-empty {
            display: flex; flex-direction: column; align-items: center; gap: 8px;
            padding: 48px 16px;
            color: var(--text-tertiary); font-size: 13px;
        }
        .yt-empty i { font-size: 32px; opacity: 0.3; }
"""
    
    content = content[:end_of_line + 1] + yt_css + content[end_of_line + 1:]
    
    with open('src/app/dashboard/page.tsx', 'w') as f:
        f.write(content)
    print("SUCCESS: Added yt-card CSS")
else:
    print("ERROR: Could not find insertion point for CSS")

print("\n=== DONE ===")
