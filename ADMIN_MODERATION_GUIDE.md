# Admin Moderation System Guide

## Overview
Sistem admin moderation untuk mengelola postingan yang melanggar ToC dan persyaratan penggunaan dengan kemampuan takedown langsung.

## Features

### 🚨 **Takedown Actions**
- **Soft Remove**: Sembunyikan postingan (bisa dikembalikan)
- **Hard Delete**: Hapus permanen (termasuk file fisik)
- **User Suspension**: Suspended user sementara/permanen
- **Auto-review**: Deteksi otomatis untuk 3+ laporan

### 📊 **Moderation Dashboard**
- **Report Queue**: Daftar postingan yang dilaporkan
- **Post Details**: Detail lengkap postingan dan media
- **User History**: Riwayat pelanggaran user
- **Statistics**: Statistik moderasi

## API Endpoints

### Admin Moderation
```php
// Get reported posts
GET /api/admin_moderation.php?action=reports&status=pending&limit=50&offset=0&admin_id=123

// Get post details
GET /api/admin_moderation.php?action=post_details&post_id=456&admin_id=123

// Get moderation stats
GET /api/admin_moderation.php?action=stats&timeframe=7%20days&admin_id=123

// Takedown post
POST /api/admin_moderation.php
{
  "action": "takedown",
  "admin_id": 123,
  "post_id": 456,
  "reason": "Violence content",
  "takedown_action": "remove" // or "delete"
}

// Suspend user
POST /api/admin_moderation.php
{
  "action": "suspend_user",
  "admin_id": 123,
  "user_id": 789,
  "reason": "Multiple violations",
  "duration": 7 // days
}
```

### User Reporting
```php
// Report a post
POST /api/report_post.php
{
  "post_id": 456,
  "reporter_id": 123,
  "reason": "inappropriate",
  "description": "Contains violent content"
}

// Get report reasons
GET /api/report_post.php?action=reasons

// Get user's reports
GET /api/report_post.php?action=my_reports&user_id=123&limit=20
```

## Database Schema

### Posts Table Updates
```sql
ALTER TABLE posts ADD COLUMN status ENUM('active', 'removed', 'deleted', 'review_pending') DEFAULT 'active';
ALTER TABLE posts ADD COLUMN removed_at TIMESTAMP NULL;
ALTER TABLE posts ADD COLUMN removed_by INT NULL;
```

### Users Table Updates
```sql
ALTER TABLE users MODIFY COLUMN status ENUM('active', 'suspended', 'banned') DEFAULT 'active';
ALTER TABLE users ADD COLUMN suspension_reason TEXT NULL;
ALTER TABLE users ADD COLUMN suspension_end TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN suspended_by INT NULL;
ALTER TABLE users ADD COLUMN suspended_at TIMESTAMP NULL;
```

### New Tables
```sql
-- Post reports
CREATE TABLE post_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    reporter_id INT NOT NULL,
    reason ENUM('spam', 'inappropriate', 'violence', 'copyright', 'harassment', 'hate_speech', 'other'),
    description TEXT,
    status ENUM('pending', 'reviewing', 'resolved', 'dismissed') DEFAULT 'pending',
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_report (post_id, reporter_id)
);

-- Admin actions log
CREATE TABLE admin_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    post_id INT NULL,
    user_id INT NULL,
    action ENUM('remove', 'delete', 'suspend_user', 'warn_user', 'approve'),
    reason TEXT NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

## Report Categories

### 🚫 **Report Reasons**
1. **Spam** - Konten spam atau menyesatkan
2. **Inappropriate** - Konten tidak pantas
3. **Violence** - Konten kekerasan atau grafis
4. **Copyright** - Pelanggaran hak cipta
5. **Harassment** - Pelecehan atau perundungan
6. **Hate Speech** - Ujaran kebencian atau diskriminasi
7. **Other** - Lainnya (dengan deskripsi)

## Moderation Workflow

### 1. **User Report**
```
User reports post → System validates → Report added to queue
```

### 2. **Auto-Review Trigger**
```
3+ reports → Post flagged → Admin notification → Priority review
```

### 3. **Admin Review**
```
Admin reviews → Take action → Log action → Notify user
```

### 4. **Actions Available**
- **Remove**: Soft delete (reversible)
- **Delete**: Permanent deletion
- **Suspend User**: Temporary/permanent ban
- **Warn**: Warning to user
- **Approve**: Mark as safe

## Admin Dashboard Features

### 📈 **Statistics Panel**
- Total reports (pending/resolved)
- Posts removed/deleted
- Users suspended
- Resolution time
- Report trends

### 📋 **Report Queue**
- Filter by status/reason
- Sort by date/priority
- Bulk actions
- Search functionality

### 🔍 **Post Review**
- Media preview
- Caption analysis
- User history
- Report details
- Similar posts

### 👤 **User Management**
- Suspension history
- Warning count
- Report statistics
- Activity timeline

## Implementation Examples

### Frontend Integration
```javascript
// Report post
async function reportPost(postId, reason, description) {
  const response = await fetch('/api/report_post.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      post_id: postId,
      reporter_id: currentUserId,
      reason: reason,
      description: description
    })
  });
  
  return await response.json();
}

// Admin takedown
async function takedownPost(postId, reason, action = 'remove') {
  const response = await fetch('/api/admin_moderation.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'takedown',
      admin_id: adminId,
      post_id: postId,
      reason: reason,
      takedown_action: action
    })
  });
  
  return await response.json();
}
```

### React Component Example
```jsx
function ReportButton({ postId, onReported }) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = async () => {
    try {
      const result = await reportPost(postId, reason, description);
      if (result.success) {
        setShowModal(false);
        onReported(result);
      }
    } catch (error) {
      console.error('Report failed:', error);
    }
  };
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Report Post
      </button>
      
      {showModal && (
        <Modal>
          <h3>Report Post</h3>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Select reason</option>
            <option value="spam">Spam</option>
            <option value="inappropriate">Inappropriate</option>
            <option value="violence">Violence</option>
            {/* ... other reasons */}
          </select>
          
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details..."
          />
          
          <button onClick={handleSubmit}>Submit Report</button>
          <button onClick={() => setShowModal(false)}>Cancel</button>
        </Modal>
      )}
    </>
  );
}
```

## Security Considerations

### 🔒 **Admin Authentication**
- Role-based access control
- Admin action logging
- Session validation
- IP whitelisting (optional)

### 🛡️ **Data Protection**
- Sensitive data encryption
- Audit trail for all actions
- Backup before deletion
- GDPR compliance

### ⚡ **Performance**
- Database indexing on report fields
- Caching for frequently accessed data
- Background processing for bulk actions
- CDN for media delivery

## Best Practices

### 📝 **Documentation**
- Clear ToC and community guidelines
- Detailed moderation policy
- Appeal process documentation
- Transparency reports

### 🤝 **User Communication**
- Clear notification for actions
- Explanation of violations
- Appeal mechanism
- Reinstatement process

### 🔧 **System Maintenance**
- Regular backup of moderation data
- Monitor system performance
- Update moderation patterns
- Train admin moderators

## Monitoring & Alerts

### 📊 **Metrics to Track**
- Report resolution time
- False positive rate
- User satisfaction
- Moderator workload
- System performance

### 🚨 **Alert Triggers**
- High volume of reports
- System errors
- Unusual admin activity
- Storage capacity issues

## Future Enhancements

### 🤖 **AI Moderation**
- Machine learning for content detection
- Automated decision making
- Pattern recognition
- Predictive analytics

### 🌐 **Advanced Features**
- Multi-language support
- Regional moderation
- Community moderation
- Appeal workflow system

### 📱 **Mobile Features**
- Push notifications for admins
- Mobile moderation app
- Quick action buttons
- Offline capabilities

## Support & Training

### 📚 **Admin Training**
- Moderation guidelines
- Tool usage training
- Decision making framework
- Conflict resolution

### 🆘 **Support System**
- Admin help desk
- Escalation process
- Technical support
- Regular updates
