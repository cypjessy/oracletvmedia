/**
 * Church configuration — single tenant.
 * All values come from env vars with sensible defaults.
 * No Firestore dependency — this is static and bundled.
 */

export interface ChurchConfig {
  id: string;
  name: string;
  tagline: string;
  logo_url?: string;
  brand_color: string;

  // AzuraCast
  azuracast_station_id: number;
  stream_url: string;
  azuracast_url?: string;

  // YouTube
  youtube_channel_id?: string;

  // BunnyCDN
  bunny_cdn_url?: string;

  // Contact
  phone?: string;
  email?: string;
  address?: string;

  // Service times
  service_times: { day: string; time: string; name: string }[];

  // Social
  social: {
    facebook_url?: string;
    youtube_url?: string;
    whatsapp_number?: string;
    instagram_url?: string;
  };
}

const CHURCH_ID =
  process.env.NEXT_PUBLIC_CHURCH_ID || "kingdom_seekers_church";

export const churchConfig: ChurchConfig = {
  id: CHURCH_ID,
  name:
    process.env.NEXT_PUBLIC_CHURCH_NAME || "Kingdom Seekers Church",
  tagline:
    process.env.NEXT_PUBLIC_CHURCH_TAGLINE || "Worship. Word. Community.",
  logo_url: undefined,
  brand_color: "#E8A838",

  azuracast_station_id: Number(
    process.env.NEXT_PUBLIC_STATION_ID || "1"
  ),
  stream_url:
    process.env.NEXT_PUBLIC_STREAM_URL ||
    "https://azuracast.histoview.co.ke/radio/8000/kingdom_seekers.mp3",
  azuracast_url:
    process.env.NEXT_PUBLIC_AZURACAST_URL ||
    "https://azuracast.histoview.co.ke",

  youtube_channel_id: process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID,
  bunny_cdn_url: process.env.NEXT_PUBLIC_BUNNY_CDN_URL,

  phone: "+254712345678",
  email: "admin@kingdomseekers.co.ke",
  address: "Nakuru, Kenya",

  service_times: [
    { day: "Sunday", time: "8:00 AM", name: "Morning Service" },
    { day: "Sunday", time: "10:30 AM", name: "Second Service" },
    { day: "Wednesday", time: "6:30 PM", name: "Bible Study" },
    { day: "Friday", time: "6:00 PM", name: "Prayer Meeting" },
  ],

  social: {
    facebook_url: "",
    youtube_url: "",
    whatsapp_number: "",
    instagram_url: "",
  },
};
