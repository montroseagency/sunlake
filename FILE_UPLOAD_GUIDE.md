# File Upload Implementation Guide

## Overview

The admin dashboard now supports **file uploads from your PC** for both room images and gallery images. You can choose to either upload files directly or use image URLs.

## Changes Made

### Backend Changes

#### 1. Models Updated (`apps/rooms/models.py` & `apps/core/models.py`)

**RoomImage Model:**
```python
image = models.ImageField(upload_to='room_images/', null=True, blank=True)
image_url = models.URLField(max_length=500, blank=True)  # Fallback option
```

**GalleryImage Model:**
```python
image = models.ImageField(upload_to='gallery_images/', null=True, blank=True)
image_url = models.URLField(max_length=500, blank=True)  # Fallback option
```

Both models now support:
- **File Upload**: Images uploaded from your PC stored in `media/room_images/` or `media/gallery_images/`
- **URL Fallback**: You can still use image URLs if preferred

#### 2. Serializers Updated

Both `RoomImageSerializer` and `GalleryImageSerializer` now:
- Accept file uploads via `ImageField`
- Return full image URLs via `image_display` field
- Support both file and URL methods
- Include validation to ensure at least one method is used

#### 3. Dependencies Installed

- **Pillow**: Python imaging library for handling image uploads
```bash
pip install Pillow
```

#### 4. Media Files Configuration

Settings already configured in `settings.py`:
```python
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

URLs configured to serve media files in development:
```python
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### Frontend Changes

#### 1. Room Management (`components/admin/RoomsManagement.tsx`)

**New Features:**
- Radio buttons to choose upload method (File or URL)
- File input for uploading images from PC
- Preview of selected file before upload
- Support for multipart/form-data uploads

**How to Use:**
1. Navigate to Rooms tab in admin dashboard
2. Find a room and scroll to "Images" section
3. Choose upload method:
   - **Upload File**: Click to browse and select image from your PC
   - **Image URL**: Enter a URL to an external image
4. Optionally add alt text
5. Click "Add Image"

#### 2. Gallery Management (`components/admin/GalleryManagement.tsx`)

**New Features:**
- Radio buttons to choose upload method (File or URL)
- File input for uploading images
- Live preview of selected file
- Support for multipart/form-data uploads

**How to Use:**
1. Navigate to Gallery tab in admin dashboard
2. Click "Add New Image"
3. Fill in title, category, etc.
4. Choose upload method:
   - **Upload File**: Click to browse and select image from your PC
   - **Image URL**: Enter a URL to an external image
5. See live preview of selected image
6. Click "Add Image" to upload

## File Upload Features

### Supported Image Formats
- JPEG/JPG
- PNG
- GIF
- WebP
- BMP

### File Organization
Uploaded files are automatically organized:
- **Room images**: `hotel-backend/media/room_images/`
- **Gallery images**: `hotel-backend/media/gallery_images/`

### Image URLs
When you upload a file, it's accessible at:
```
http://localhost:8000/media/room_images/filename.jpg
http://localhost:8000/media/gallery_images/filename.jpg
```

The frontend automatically displays the full URL.

## How It Works

### Upload Process

1. **Frontend**:
   - User selects a file using file input
   - File is stored in component state
   - On submit, file is added to FormData object
   - Request sent with `Content-Type: multipart/form-data`

2. **Backend**:
   - Django receives multipart form data
   - DRF deserializes the file using ImageField
   - Pillow validates the image
   - File saved to `media/room_images/` or `media/gallery_images/`
   - Database stores the file path
   - API returns full URL via `image_display` field

3. **Display**:
   - Frontend receives `image_display` with full URL
   - Images displayed using the uploaded file URL

### Dual Method Support

You can use BOTH methods:
- **Upload File**: For images on your computer
- **Image URL**: For images hosted elsewhere (Unsplash, etc.)

The system automatically:
- Prioritizes uploaded files over URLs
- Falls back to URL if no file is uploaded
- Validates that at least one method is provided

## Testing

### Test Room Image Upload

1. Login at `http://localhost:3000/admin/login`
2. Go to Rooms tab
3. Select a room (or create one)
4. Scroll to Images section
5. Choose "Upload File"
6. Click file input and select an image
7. Add alt text (optional)
8. Click "Add Image"
9. Image should appear in the grid

### Test Gallery Image Upload

1. Login at `http://localhost:3000/admin/login`
2. Go to Gallery tab
3. Click "Add New Image"
4. Enter title and category
5. Choose "Upload File"
6. Select an image from your PC
7. See preview appear automatically
8. Click "Add Image"
9. Image should appear in the gallery grid

## Troubleshooting

### Issue: "Error adding image" or validation error

**Solution**: Make sure you either:
- Select a file (if using Upload File method), OR
- Enter a valid URL (if using Image URL method)

### Issue: Image not displaying after upload

**Possible causes**:
1. Django server not running - Start with `python manage.py runserver`
2. Media directory doesn't exist - Created automatically on first upload
3. CORS issue - Already configured in settings

**Check**:
```bash
# Verify media directory exists
ls hotel-backend/media/

# Verify uploaded files
ls hotel-backend/media/room_images/
ls hotel-backend/media/gallery_images/
```

### Issue: File too large

Django has default upload limits. To increase:

**settings.py**:
```python
# Max upload size (in bytes) - example: 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760
```

### Issue: Invalid image file

**Solution**: Only use supported image formats:
- JPEG, PNG, GIF, WebP, BMP
- Ensure file is not corrupted
- Try a different image

## API Usage Examples

### Upload Room Image (cURL)

```bash
curl -X POST http://localhost:8000/api/rooms/deluxe-suite/add_image/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "alt_text=Beautiful room view" \
  -F "is_primary=false" \
  -F "order=0"
```

### Upload Gallery Image (cURL)

```bash
curl -X POST http://localhost:8000/api/gallery/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Hotel Lobby" \
  -F "image=@/path/to/lobby.jpg" \
  -F "category=HOTEL" \
  -F "description=Our beautiful lobby" \
  -F "order=1" \
  -F "is_active=true"
```

### Using URL Instead of File

```bash
curl -X POST http://localhost:8000/api/gallery/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hotel Lobby",
    "image_url": "https://example.com/lobby.jpg",
    "category": "HOTEL",
    "is_active": true
  }'
```

## Security Considerations

### File Validation

- Only image files accepted (`accept="image/*"` in HTML)
- Pillow validates image format on backend
- Invalid files rejected with error message

### File Size

- Consider adding file size limits for production
- Implement image compression for large files

### File Storage

- Development: Files stored locally in `media/`
- Production: Consider cloud storage (AWS S3, Cloudinary)

## Migration from URLs to Files

If you have existing images using URLs, they will continue to work! The system:
1. Checks if an uploaded file exists
2. If yes, uses the uploaded file
3. If no, falls back to the URL

You can gradually migrate by:
1. Re-uploading images as files
2. Old URL-based images continue working
3. Eventually remove URLs if desired

## Next Steps / Enhancements

1. **Image Compression**: Auto-compress images on upload
2. **Thumbnails**: Generate different sizes automatically
3. **Drag & Drop**: Add drag-and-drop file upload
4. **Multiple Files**: Upload multiple images at once
5. **Cloud Storage**: Integrate AWS S3 or Cloudinary for production
6. **Progress Bar**: Show upload progress for large files
7. **Image Editing**: Crop, resize, or filter images before upload

## Summary

You can now:
- ✅ Upload images directly from your PC in Room Management
- ✅ Upload images directly from your PC in Gallery Management
- ✅ Choose between file upload or URL for each image
- ✅ See live previews of selected files
- ✅ Images automatically organized in media directories
- ✅ Full URL returned and displayed in frontend
- ✅ Backward compatible with existing URL-based images

No more need to host images externally - just upload directly from your computer!
