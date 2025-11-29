# Admin Dashboard Implementation Guide

## Overview

A complete admin dashboard has been implemented with full CRUD functionality for managing rooms, gallery images, and bookings directly from the frontend dashboard at `/admin/dashboard`.

## Features Implemented

### Backend API Endpoints

#### 1. Room Management (`/api/rooms/`)
- **GET** `/api/rooms/` - List all rooms (with filters)
- **POST** `/api/rooms/` - Create new room (Admin/Staff only)
- **GET** `/api/rooms/{slug}/` - Get room details
- **PATCH** `/api/rooms/{slug}/` - Update room (Admin/Staff only)
- **DELETE** `/api/rooms/{slug}/` - Delete room (Admin/Staff only)
- **POST** `/api/rooms/{slug}/add_image/` - Add image to room (Admin/Staff only)
- **DELETE** `/api/rooms/{slug}/remove_image/{image_id}/` - Remove image (Admin/Staff only)

#### 2. Room Images Management (`/api/room-images/`)
- Full CRUD operations for room images
- Support for image URL, alt text, primary flag, and ordering

#### 3. Gallery Management (`/api/gallery/`)
- **GET** `/api/gallery/` - List gallery images (public)
- **POST** `/api/gallery/` - Add gallery image (Admin/Staff only)
- **PATCH** `/api/gallery/{id}/` - Update gallery image (Admin/Staff only)
- **DELETE** `/api/gallery/{id}/` - Delete gallery image (Admin/Staff only)
- Filter by category: HOTEL, ROOM, DINING, FACILITIES, EVENTS, OTHER

#### 4. Bookings Management (`/api/bookings/`)
- **GET** `/api/bookings/` - List all bookings (Admin sees all, users see their own)
- **PATCH** `/api/bookings/{id}/` - Update booking (Admin/Staff only)
- **DELETE** `/api/bookings/{id}/` - Delete booking (Admin/Staff only)
- **PATCH** `/api/bookings/{id}/update_status/` - Update booking status (Admin/Staff only)
- Filter by status: PENDING, CONFIRMED, CANCELLED, CHECKED_IN, CHECKED_OUT
- Filter by date range

### Frontend Dashboard Components

#### Dashboard Layout (`/admin/dashboard`)
The dashboard includes 4 main tabs:

1. **Overview Tab**
   - Statistics cards showing:
     - Total Rooms
     - Total Bookings
     - Active Bookings
     - Gallery Images
   - Quick access buttons to other tabs

2. **Rooms Tab**
   - View all rooms in a card layout
   - Add new rooms with full details:
     - Name, description, room type, capacity
     - Size (sqm), base price per night
     - Amenities selection
     - Active/inactive status
   - Edit existing rooms
   - Delete rooms
   - **Image Management per Room:**
     - View all images for each room
     - Add new images (by URL)
     - Remove images
     - See which image is primary

3. **Gallery Tab**
   - View all gallery images in a grid
   - Add new gallery images:
     - Title, description
     - Image URL
     - Category selection
     - Order number
     - Active/inactive status
   - Filter by category
   - Edit existing images
   - Delete images
   - Live preview of images

4. **Bookings Tab**
   - View all bookings in a table format
   - Filter by booking status
   - See full booking details:
     - Guest information
     - Room details
     - Check-in/out dates
     - Total price
     - Special requests
   - Update booking status via dropdown
   - Delete bookings
   - Expandable rows for detailed information

## How to Use

### Access the Dashboard

1. Navigate to `http://localhost:3000/admin/login`
2. Login with admin or staff credentials
3. You'll be redirected to `http://localhost:3000/admin/dashboard`

### Managing Rooms

1. Click the **Rooms** tab
2. Click **Add New Room** button
3. Fill in the form:
   - Room name (e.g., "Deluxe Ocean View Suite")
   - Room type (Standard, Deluxe, Suite, Penthouse)
   - Capacity (number of guests)
   - Size in square meters
   - Base price per night
   - Description
   - Select amenities
   - Set active status
4. Click **Create Room**

**To add images to a room:**
1. Find the room in the list
2. Scroll to the "Images" section
3. Enter the image URL and optional alt text
4. Click **Add Image**

**To edit or delete a room:**
1. Click **Edit** to modify room details
2. Click **Delete** to remove the room (after confirmation)

### Managing Gallery

1. Click the **Gallery** tab
2. Click **Add New Image** button
3. Fill in the form:
   - Title
   - Category (Hotel, Room, Dining, Facilities, Events, Other)
   - Order (for display sorting)
   - Image URL
   - Description (optional)
   - Active status
4. Click **Add Image**
5. Use the category filter to view images by category

### Managing Bookings

1. Click the **Bookings** tab
2. View all bookings in the table
3. Use the status filter to view specific booking statuses
4. Update booking status using the dropdown in each row
5. Click **Details** to see full booking information
6. Click **Delete** to remove a booking (after confirmation)

## Database Models

### GalleryImage Model
```python
- id: Primary key
- title: Image title
- description: Optional description
- image_url: URL to the image
- category: HOTEL/ROOM/DINING/FACILITIES/EVENTS/OTHER
- order: Display order (integer)
- is_active: Boolean
- created_at: Timestamp
- updated_at: Timestamp
```

## API Permissions

- **Public endpoints:** GET rooms, GET gallery images, POST bookings, check availability
- **Authenticated endpoints:** GET user's own bookings
- **Admin/Staff only endpoints:** All POST, PATCH, DELETE operations for rooms, gallery, and bookings

## Image Handling

Currently, the system uses **image URLs**. This means:
- Images should be hosted externally (e.g., Cloudinary, AWS S3, Imgur)
- Paste the complete URL when adding images
- The system validates URL format

**Example image URLs:**
- `https://example.com/hotel-room.jpg`
- `https://images.unsplash.com/photo-example`
- `https://cdn.example.com/images/suite.png`

## Next Steps / Future Enhancements

1. **File Upload:** Implement direct file upload instead of URLs
2. **Image Compression:** Add automatic image optimization
3. **Drag & Drop:** Allow drag-and-drop for image ordering
4. **Bulk Operations:** Add bulk actions for multiple items
5. **Search:** Add search functionality for rooms and bookings
6. **Export:** Add CSV/PDF export for bookings
7. **Analytics:** Add charts and graphs for booking trends
8. **Notifications:** Email notifications for new bookings

## Troubleshooting

**Can't access dashboard:**
- Ensure you're logged in with Admin or Staff role
- Check browser console for errors
- Verify JWT token is stored in localStorage

**Images not displaying:**
- Verify image URL is valid and accessible
- Check image URL format (must include https://)
- Ensure CORS is properly configured if images are from external sources

**Can't create/update items:**
- Verify you're logged in as Admin/Staff
- Check network tab for API errors
- Ensure all required fields are filled

## API Testing

You can test the APIs using tools like Postman or curl:

```bash
# Get all rooms
curl http://localhost:8000/api/rooms/

# Create a room (requires authentication)
curl -X POST http://localhost:8000/api/rooms/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Room", "room_type": "STANDARD", "capacity": 2, "base_price_per_night": "150.00", "description": "Test description"}'

# Get all gallery images
curl http://localhost:8000/api/gallery/

# Add gallery image (requires authentication)
curl -X POST http://localhost:8000/api/gallery/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Image", "category": "HOTEL", "image_url": "https://example.com/image.jpg"}'
```

## File Structure

```
hotel-backend/
├── apps/
│   ├── rooms/
│   │   ├── models.py (Room, RoomImage, Amenity)
│   │   ├── serializers.py (Room CRUD serializers)
│   │   ├── views.py (RoomViewSet, RoomImageViewSet)
│   │   └── urls.py
│   ├── core/
│   │   ├── models.py (GalleryImage)
│   │   ├── serializers.py (GalleryImageSerializer)
│   │   ├── views.py (GalleryImageViewSet)
│   │   └── urls.py
│   └── bookings/
│       ├── models.py (Booking)
│       ├── serializers.py (BookingSerializer)
│       └── views.py (BookingViewSet - enhanced)

hotel-frontend/
├── app/
│   └── admin/
│       ├── login/
│       │   └── page.tsx
│       └── dashboard/
│           └── page.tsx (Main dashboard with tabs)
└── components/
    └── admin/
        ├── RoomsManagement.tsx
        ├── GalleryManagement.tsx
        └── BookingsManagement.tsx
```

## Summary

You now have a fully functional admin dashboard that allows you to:
- ✅ Manage rooms with images and pricing from the frontend
- ✅ Upload and organize gallery images by category from the frontend
- ✅ View and manage all reservations from the frontend
- ✅ All integrated with backend API endpoints
- ✅ Proper authentication and authorization
- ✅ Clean, responsive UI with Tailwind CSS

The admin no longer needs to use Django's admin panel for these operations - everything can be done from the beautiful custom frontend dashboard!
