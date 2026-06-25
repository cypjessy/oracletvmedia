"use client";

export default function NotificationsPanel() {
  return (
    <>
      <div className="notif-overlay" id="notifOverlay" />
      <div className="notifications-panel" id="notifPanel">
        <div className="notif-header">
          <h2>Notifications</h2>
          <button className="notif-close" id="notifClose">
            <i className="fas fa-xmark"></i>
          </button>
        </div>
        <div className="notif-list">
          <div className="notif-item">
            <div className="notif-icon live"><i className="fas fa-radio"></i></div>
            <div className="notif-content">
              <div className="notif-title">Live Service Starting</div>
              <div className="notif-body">Sunday Worship Service is now live. Join us!</div>
              <div className="notif-time">2 min ago</div>
            </div>
            <div className="notif-unread"></div>
          </div>
          <div className="notif-item">
            <div className="notif-icon sermon"><i className="fas fa-video"></i></div>
            <div className="notif-content">
              <div className="notif-title">New Sermon Available</div>
              <div className="notif-body">&quot;Walking in Faith&quot; by Pastor James is now available</div>
              <div className="notif-time">1 hour ago</div>
            </div>
            <div className="notif-unread"></div>
          </div>
          <div className="notif-item">
            <div className="notif-icon event"><i className="fas fa-calendar"></i></div>
            <div className="notif-content">
              <div className="notif-title">Youth Conference 2026</div>
              <div className="notif-body">Registration is now open. Early bird ends July 15</div>
              <div className="notif-time">3 hours ago</div>
            </div>
          </div>
          <div className="notif-item">
            <div className="notif-icon sermon"><i className="fas fa-headphones"></i></div>
            <div className="notif-content">
              <div className="notif-title">Radio Schedule Updated</div>
              <div className="notif-body">Check out this week&apos;s programming lineup</div>
              <div className="notif-time">Yesterday</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
