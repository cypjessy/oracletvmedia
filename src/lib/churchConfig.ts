/**
 * Church configuration — single tenant.
 * All values must come from env vars. No hardcoded defaults.
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

export const churchConfig: ChurchConfig = {
  id: process.env.NEXT_PUBLIC_CHURCH_ID || "",
  name: process.env.NEXT_PUBLIC_CHURCH_NAME || "",
  tagline: process.env.NEXT_PUBLIC_CHURCH_TAGLINE || "",
  logo_url: process.env.NEXT_PUBLIC_CHURCH_LOGO_URL || undefined,
  brand_color: process.env.NEXT_PUBLIC_BRAND_COLOR || "#9775FA",

  azuracast_station_id: Number(process.env.NEXT_PUBLIC_STATION_ID) || 0,
  stream_url: process.env.NEXT_PUBLIC_STREAM_URL || "",
  azuracast_url: process.env.NEXT_PUBLIC_AZURACAST_URL || "",

  youtube_channel_id: process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || undefined,
  bunny_cdn_url: process.env.NEXT_PUBLIC_BUNNY_CDN_URL || undefined,

  phone: process.env.NEXT_PUBLIC_CHURCH_PHONE || "",
  email: process.env.NEXT_PUBLIC_CHURCH_EMAIL || "",
  address: process.env.NEXT_PUBLIC_CHURCH_ADDRESS || "",

  service_times: [],

  social: {
    facebook_url: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
    youtube_url: process.env.NEXT_PUBLIC_YOUTUBE_URL || "",
    whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    instagram_url: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
  },
};
