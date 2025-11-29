export interface Amenity {
  id: number;
  name: string;
  icon?: string;
}

export interface RoomImage {
  id: number;
  image: string;
  image_url?: string;
  image_display?: string;  // Full URL for displaying the image
  alt_text: string;
  is_primary: boolean;
  order: number;
}

export type RoomType = 'STANDARD' | 'DELUXE' | 'SUITE' | 'PENTHOUSE';

export interface RoomAvailabilityPeriod {
  id: number;
  room: number;
  room_name: string;
  start_date: string;
  end_date: string;
  status: 'BUSY' | 'MAINTENANCE' | 'BLOCKED';
  status_display: string;
  notes: string;
  booking: number | null;
  created_at: string;
}

export interface Room {
  id: number;
  name: string;
  slug: string;
  description: string;
  room_type: RoomType;
  capacity: number;
  size_sqm?: number;
  base_price_per_night: string;
  amenities: Amenity[];
  images: RoomImage[];
  is_active: boolean;
  created_at: string;
  availability_periods?: RoomAvailabilityPeriod[];
  is_currently_available?: boolean;
}

export interface RoomListItem {
  id: number;
  name: string;
  slug: string;
  room_type: RoomType;
  capacity: number;
  base_price_per_night: string;
  primary_image: string | null;
  amenities: Amenity[];
}
