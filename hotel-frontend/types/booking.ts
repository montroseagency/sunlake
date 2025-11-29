import { RoomListItem } from './room';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN' | 'CHECKED_OUT';

export interface Booking {
  id: number;
  room: RoomListItem;
  check_in_date: string;
  check_out_date: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  number_of_guests: number;
  special_requests: string;
  total_price: string;
  status: BookingStatus;
  nights: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingData {
  room: number;
  check_in_date: string;
  check_out_date: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  number_of_guests: number;
  special_requests?: string;
}
