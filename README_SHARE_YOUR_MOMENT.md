# Share Your Moment - Multiple Upload System

## Overview
Sistem upload multiple files untuk "Share Your Moment" dengan fokus pada security, efisiensi penyimpanan, dan validasi konten.

## Features

### 1. Security Features
- **File Type Validation**: Hanya mendukung JPG, PNG, WEBP, MP4, WEBM
- **Malware Scanning**: Deteksi pattern malicious code
- **File Size Limit**: Maksimal 50MB per file
- **Secure Filename Generation**: Menggunakan timestamp + random bytes
- **MIME Type Verification**: Validasi tipe file sebenarnya

### 2. Content Moderation
- **Automated Image Analysis**: Integrasi dengan Google Vision API
- **Text Moderation**: Deteksi konten SARA (Suku, Agama, Ras, Antar-golongan)
- **Spam Detection**: Filter URL dan commercial content
- **Manual Review Queue**: Sistem review untuk konten yang ambigu

### 3. Storage Optimization
- **Image Compression**: Otomatis compress gambar (85% quality)
- **Thumbnail Generation**: Buat thumbnail 300x300px
- **CDN Integration**: Support untuk Cloudflare, AWS CloudFront
- **Storage Analytics**: Monitor penggunaan storage
- **Automatic Cleanup**: Hapus file lama (configurable)

## API Endpoints

### Upload Multiple Files
```
POST /api/upload_multiple.php
Content-Type: multipart/form-data

Parameters:
- files: Array of files (max 10 files)
- user_id: User ID (required)
- caption: Text caption (optional)
```

### Create Post with Multiple Media
```
POST /api/posts_multiple.php
Content-Type: application/json

{
  "userId": 123,
  "caption": "My moment",
  "mediaFiles": [
    {
      "url": "https://domain.com/uploads/file1.jpg",
      "type": "image",
      "size": 1024000,
      "original_name": "photo1.jpg"
    }
  ],
  "location": "Jakarta",
  "tags": "travel,food"
}
```

### Content Moderation
```
POST /api/content_moderator.php
Content-Type: application/json

{
  "action": "moderate_image",
  "image_path": "/path/to/image.jpg"
}

{
  "action": "moderate_text",
  "text": "Check this content"
}
```

### Storage Optimization
```
POST /api/storage_optimizer.php
Content-Type: application/json

{
  "action": "optimize_image",
  "file_path": "/path/to/image.jpg",
  "quality": 85
}

{
  "action": "get_stats"
}
```

## Database Schema

### Posts Table (Existing)
```sql
posts:
- id, user_id, type, caption, url, location_name, tags
- likes, comments, shares, saves
- created_at
```

### New Tables
```sql
-- Multiple media per post
post_media:
- id, post_id, media_url, media_type, file_size
- original_name, sort_order, created_at

-- Content moderation queue
content_review_queue:
- id, file_path, mime_type, status
- reviewed_by, review_notes, created_at

-- Moderation logs
content_moderation_log:
- id, file_path, approved, reason, confidence
- moderator_type, created_at
```

## Implementation Steps

### 1. Frontend Integration
```javascript
// Upload multiple files
const formData = new FormData();
files.forEach(file => {
  formData.append('files[]', file);
});
formData.append('user_id', userId);
formData.append('caption', caption);

fetch('/api/upload_multiple.php', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  // Create post with uploaded files
  return createPostWithMedia(data.files);
});
```

### 2. Security Configuration
```php
// In config.php
define('MAX_FILE_SIZE', 50 * 1024 * 1024); // 50MB
define('MAX_FILES_PER_UPLOAD', 10);
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/webp']);
define('ALLOWED_VIDEO_TYPES', ['video/mp4', 'video/webm', 'video/quicktime']);
```

### 3. Content Moderation Setup
```php
// Google Vision API integration
$visionApiKey = 'YOUR_GOOGLE_VISION_API_KEY';
$moderationThreshold = 0.6; // 60% confidence
```

## Best Practices

### Security
1. **Always validate file types** using both MIME type and file signature
2. **Scan uploaded files** for malware patterns
3. **Use secure filenames** to prevent directory traversal
4. **Implement rate limiting** for upload endpoints
5. **Store files outside web root** when possible

### Performance
1. **Compress images** automatically after upload
2. **Generate thumbnails** for faster loading
3. **Use CDN** for file delivery
4. **Implement lazy loading** for media content
5. **Cache moderation results** for repeated content

### Content Moderation
1. **Multi-layer moderation**: Automated + Manual review
2. **Confidence thresholds**: Set appropriate confidence levels
3. **Appeal process**: Allow users to contest moderation decisions
4. **Regular updates**: Keep moderation patterns updated
5. **Transparency**: Log all moderation actions

## Monitoring & Analytics

### Storage Metrics
- Total storage used
- File type distribution
- Compression savings
- Upload trends

### Moderation Metrics
- Approval/rejection rates
- False positive rates
- Review queue length
- Moderator performance

## Future Enhancements

1. **AI-powered moderation**: Advanced ML models
2. **Video transcoding**: Automatic video optimization
3. **Object detection**: Auto-tagging content
4. **Duplicate detection**: Prevent spam uploads
5. **User reputation**: Trust-based moderation

## Dependencies

### Required PHP Extensions
- `gd` or `imagick` for image processing
- `fileinfo` for MIME type detection
- `pdo_mysql` for database connection
- `curl` for external API calls

### Optional Extensions
- `ffmpeg` for video processing
- `exif` for image metadata

### External Services
- Google Cloud Vision API (for content moderation)
- CDN service (Cloudflare, AWS CloudFront)
- Object storage (AWS S3, Google Cloud Storage)

## Security Considerations

1. **File Upload Security**:
   - Validate file extensions and MIME types
   - Scan for malicious content
   - Use secure file naming
   - Set proper file permissions

2. **Content Security**:
   - Implement content moderation
   - Rate limiting for uploads
   - User authentication required
   - Audit logging for all actions

3. **Storage Security**:
   - Regular backup of uploaded files
   - Access control on storage directories
   - Monitor for unusual activity
   - Implement retention policies

## Support & Maintenance

- Regular security updates
- Monitor storage usage
- Update moderation patterns
- Performance optimization
- User feedback collection
