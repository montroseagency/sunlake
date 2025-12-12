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

export type BedType = 'SINGLE' | 'TWIN' | 'DOUBLE' | 'QUEEN' | 'KING' | 'SOFA_BED' | 'BUNK_BED';
export type ViewType = 'CITY' | 'SEA' | 'GARDEN' | 'MOUNTAIN' | 'POOL' | 'COURTYARD' | 'NO_VIEW';
export type SmokingPolicy = 'NON_SMOKING' | 'SMOKING' | 'DESIGNATED_AREA';
export type PetPolicy = 'NOT_ALLOWED' | 'SMALL_PETS' | 'ALL_PETS' | 'SERVICE_ANIMALS';

export interface Room {
  id: number;
  name: string;
  slug: string;
  description: string;
  room_type: RoomType;
  room_type_display?: string;
  capacity: number;
  size_sqm?: number;
  base_price_per_night: string;
  amenities: Amenity[];
  images: RoomImage[];
  is_active: boolean;
  created_at: string;
  availability_periods?: RoomAvailabilityPeriod[];
  is_currently_available?: boolean;
  // New fields
  max_occupancy?: number;
  bed_configuration?: BedType;
  bed_configuration_display?: string;
  number_of_beds?: number;
  wifi?: boolean;
  air_conditioning?: boolean;
  tv?: boolean;
  telephone?: boolean;
  safe?: boolean;
  minibar?: boolean;
  coffee_maker?: boolean;
  bathrobe_slippers?: boolean;
  hairdryer?: boolean;
  iron_ironing_board?: boolean;
  view_type?: ViewType;
  view_type_display?: string;
  has_balcony?: boolean;
  soundproof?: boolean;
  special_perks?: string;
  bathroom_features?: string;
  wheelchair_accessible?: boolean;
  accessible_bathroom?: boolean;
  check_in_time?: string;
  check_out_time?: string;
  smoking_policy?: SmokingPolicy;
  smoking_policy_display?: string;
  pet_policy?: PetPolicy;
  pet_policy_display?: string;
  has_kitchenette?: boolean;
  has_seating_area?: boolean;
  virtual_tour_url?: string;
}

export interface RoomListItem {
  id: number;
  name: string;
  slug: string;
  room_type: RoomType;
  capacity: number;
  max_occupancy?: number;
  base_price_per_night: string;
  primary_image: string | null;
  amenities: Amenity[];
  view_type?: ViewType;
  bed_configuration?: BedType;
  wifi?: boolean;
  air_conditioning?: boolean;
  wheelchair_accessible?: boolean;
}
