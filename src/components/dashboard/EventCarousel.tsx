"use client";

export default function EventCarousel() {
  return (
    <>
      <div className="section-header">
        <h2 className="section-title">Upcoming Events</h2>
        <button className="section-see-all">
          See All <i className="fas fa-chevron-right" style={{ fontSize: "10px" }}></i>
        </button>
      </div>
      <div className="horizontal-scroll">
        <div className="event-card">
          <div className="event-image">
            <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=220&fit=crop" alt="Event" />
            <div className="event-date-badge">
              <div className="day">28</div>
              <div className="month">Jun</div>
            </div>
          </div>
          <div className="event-info">
            <div className="event-title">Youth Night of Worship</div>
            <div className="event-details">
              <div className="event-detail"><i className="fas fa-clock"></i> 6:00 PM - 9:00 PM</div>
              <div className="event-detail"><i className="fas fa-location-dot"></i> Main Sanctuary</div>
            </div>
          </div>
        </div>
        <div className="event-card">
          <div className="event-image">
            <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=220&fit=crop" alt="Event" />
            <div className="event-date-badge">
              <div className="day">05</div>
              <div className="month">Jul</div>
            </div>
          </div>
          <div className="event-info">
            <div className="event-title">Community Outreach Day</div>
            <div className="event-details">
              <div className="event-detail"><i className="fas fa-clock"></i> 8:00 AM - 4:00 PM</div>
              <div className="event-detail"><i className="fas fa-location-dot"></i> Kibera Slums</div>
            </div>
          </div>
        </div>
        <div className="event-card">
          <div className="event-image">
            <img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=220&fit=crop" alt="Event" />
            <div className="event-date-badge">
              <div className="day">12</div>
              <div className="month">Jul</div>
            </div>
          </div>
          <div className="event-info">
            <div className="event-title">Annual Choir Concert</div>
            <div className="event-details">
              <div className="event-detail"><i className="fas fa-clock"></i> 5:00 PM - 8:30 PM</div>
              <div className="event-detail"><i className="fas fa-location-dot"></i> Conference Hall</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
