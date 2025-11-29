# Sunlake Hotel - Full Stack Hotel Management System

A complete hotel management system built with **Next.js** (frontend) and **Django + DRF** (backend).

## 🎯 Features

### Guest Features
- ✅ Browse available rooms with advanced filters
- ✅ Real-time availability checking
- ✅ View room details with image galleries
- ✅ Make reservations with guest information
- ✅ Price calculation with seasonal pricing support

### Admin Features (via Django Admin)
- ✅ Manage rooms (create, edit, delete)
- ✅ Upload room images (URL-based)
- ✅ Manage bookings and update status
- ✅ Set seasonal pricing
- ✅ User management with roles

## 🏗️ Tech Stack

### Backend
- Django 5.x + Django REST Framework
- JWT Authentication
- SQLite (development) - easily switchable to PostgreSQL
- CORS enabled for frontend communication

### Frontend
- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS
- Axios for API calls
- Responsive design

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### 1. Backend Setup

```bash
# Navigate to backend directory
cd hotel-backend

# Install Python dependencies
pip install -r requirements.txt

# Run migrations (already applied)
python manage.py migrate

# Create a superuser for admin access
python manage.py createsuperuser
# Follow prompts to set username, email, and password

# Start the Django development server
python manage.py runserver
```

Backend will be running at **http://localhost:8000**

### 2. Frontend Setup

```bash
# Open a NEW terminal window
# Navigate to frontend directory
cd hotel-frontend

# Install Node dependencies (if not already done)
npm install

# Start the Next.js development server
npm run dev
```

Frontend will be running at **http://localhost:3000**

## 📊 Adding Sample Data

1. **Access Django Admin**: http://localhost:8000/admin
2. **Login** with your superuser credentials
3. **Add Amenities**:
   - Go to "Amenities" → "Add Amenity"
   - Examples: WiFi, Pool, Spa, Parking, Breakfast, Gym, etc.

4. **Add Rooms**:
   - Go to "Rooms" → "Add Room"
   - Fill in details:
     - Name: "Deluxe Ocean View Room"
     - Room type: DELUXE
     - Capacity: 2
     - Base price per night: 150.00
     - Description: "Spacious room with ocean view..."
     - Select amenities
   - Add Room Images (inline):
     - Image URL: Use free images from Unsplash
       - Example: `https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800`
     - Mark one as primary

5. **Test the Frontend**:
   - Visit http://localhost:3000
   - Click "Explore Rooms"
   - You should see your rooms!

## 📁 Project Structure

```
sunlake/
├── hotel-backend/              # Django REST API
│   ├── apps/
│   │   ├── users/             # Custom user with roles
│   │   ├── rooms/             # Room models & API
│   │   ├── bookings/          # Booking system
│   │   └── core/              # Shared utilities
│   ├── hotel_project/         # Django settings
│   ├── manage.py
│   └── db.sqlite3
│
└── hotel-frontend/            # Next.js application
    ├── app/                   # App Router pages
    │   ├── page.tsx          # Home page
    │   └── rooms/            # Rooms pages
    ├── components/            # React components
    ├── lib/                   # API client, utilities
    ├── types/                 # TypeScript types
    └── public/                # Static files
```

## 🔌 API Endpoints

### Public Endpoints
- `GET /api/rooms/` - List all rooms (with filters)
- `GET /api/rooms/{slug}/` - Get room details
- `POST /api/bookings/` - Create a booking
- `GET /api/bookings/check-availability/` - Check availability
- `POST /api/auth/login/` - Login
- `POST /api/auth/refresh/` - Refresh token

### Admin Endpoints (Requires Authentication)
- `POST /api/rooms/` - Create room
- `PUT/PATCH /api/rooms/{id}/` - Update room
- `DELETE /api/rooms/{id}/` - Delete room
- `GET /api/bookings/` - List all bookings
- `PATCH /api/bookings/{id}/` - Update booking status

## 🎨 Customization

### Change Colors
Edit `hotel-frontend/tailwind.config.ts`:
```typescript
colors: {
  primary: {
    500: '#0ea5e9',  // Change this!
  },
}
```

### Add More Room Types
Edit `hotel-backend/apps/rooms/models.py`:
```python
class RoomType(models.TextChoices):
    STANDARD = 'STANDARD', 'Standard Room'
    DELUXE = 'DELUXE', 'Deluxe Room'
    SUITE = 'SUITE', 'Suite'
    PENTHOUSE = 'PENTHOUSE', 'Penthouse'
    # Add more here!
```

## 🧪 Testing the Availability System

1. Add a room in Django Admin
2. Create a booking for that room (e.g., Jan 10 - Jan 15)
3. Go to frontend `/rooms`
4. Filter with dates Jan 12 - Jan 14
5. The room should NOT appear (it's booked!)
6. Filter with dates Jan 16 - Jan 20
7. The room should appear (it's available!)

## 🐛 Troubleshooting

### Backend won't start
```bash
# Make sure you're in the right directory
cd hotel-backend

# Check if migrations are applied
python manage.py migrate

# Try running with verbose output
python manage.py runserver --verbosity 3
```

### Frontend won't start
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

### CORS Errors
Make sure backend settings.py has:
```python
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
```

And the frontend .env.local has:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 🚀 Next Steps

### Essential Improvements
1. ✅ Complete booking flow (currently basic)
2. ✅ Add authentication for users
3. ✅ Build admin dashboard in frontend
4. ✅ Add email notifications
5. ✅ Implement payment gateway (Stripe, PayPal)

### Deployment
1. **Backend**: Railway, Heroku, AWS, DigitalOcean
2. **Frontend**: Vercel, Netlify
3. **Database**: PostgreSQL (Neon, Supabase, RDS)
4. **Media Files**: S3, Cloudinary

## 📝 License

MIT License - feel free to use this for your projects!

## 🤝 Contributing

This is a starter template. Feel free to extend it with:
- Reviews and ratings
- Photo galleries
- Multi-language support
- Advanced admin analytics
- Mobile app
- And more!

---

**Built with ❤️ using Django + Next.js**

Need help? Check the `IMPLEMENTATION_GUIDE.md` for detailed code explanations!
