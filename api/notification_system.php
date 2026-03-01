<?php
header('Content-Type: application/json');
require 'config.php';

class NotificationSystem {
    private $pdo;
    private $pushNotificationKey;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->pushNotificationKey = $_ENV['PUSH_NOTIFICATION_KEY'] ?? null;
        $this->createNotificationTables();
    }
    
    private function createNotificationTables() {
        // Main notifications table
        $sql = "
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                data JSON NULL,
                priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
                read_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_unread (user_id, read_at),
                INDEX idx_type (type),
                INDEX idx_created (created_at),
                INDEX idx_priority (priority)
            )
        ";
        $this->pdo->exec($sql);
        
        // Push notification tokens table
        $sql = "
            CREATE TABLE IF NOT EXISTS push_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token VARCHAR(500) NOT NULL,
                platform ENUM('web', 'ios', 'android') NOT NULL,
                device_info JSON NULL,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_token (user_id, token),
                INDEX idx_user (user_id),
                INDEX idx_platform (platform)
            )
        ";
        $this->pdo->exec($sql);
        
        // Notification preferences table
        $sql = "
            CREATE TABLE IF NOT EXISTS notification_preferences (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                preferences JSON NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user (user_id)
            )
        ";
        $this->pdo->exec($sql);
        
        // Notification logs table
        $sql = "
            CREATE TABLE IF NOT EXISTS notification_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                notification_id INT NOT NULL,
                delivery_method ENUM('in_app', 'push', 'email', 'sms') NOT NULL,
                status ENUM('sent', 'delivered', 'failed', 'bounced') NOT NULL,
                error_message TEXT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_notification (notification_id),
                INDEX idx_status (status),
                INDEX idx_method (delivery_method)
            )
        ";
        $this->pdo->exec($sql);
    }
    
    public function createNotification($userId, $type, $title, $message, $data = null, $priority = 'normal') {
        try {
            // Check user preferences
            if (!$this->shouldSendNotification($userId, $type)) {
                return ['success' => false, 'message' => 'User has disabled this notification type'];
            }
            
            // Insert notification
            $stmt = $this->pdo->prepare("
                INSERT INTO notifications 
                (user_id, type, title, message, data, priority) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([$userId, $type, $title, $message, json_encode($data), $priority]);
            $notificationId = $this->pdo->lastInsertId();
            
            // Send push notification if enabled
            $this->sendPushNotification($userId, $notificationId, $title, $message, $data, $priority);
            
            // Send email notification for high priority
            if (in_array($priority, ['high', 'urgent'])) {
                $this->sendEmailNotification($userId, $notificationId, $title, $message, $data);
            }
            
            return [
                'success' => true,
                'notification_id' => $notificationId,
                'message' => 'Notification created successfully'
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    public function createBulkNotifications($userIds, $type, $title, $message, $data = null, $priority = 'normal') {
        $results = ['success' => 0, 'failed' => 0, 'errors' => []];
        
        foreach ($userIds as $userId) {
            $result = $this->createNotification($userId, $type, $title, $message, $data, $priority);
            
            if ($result['success']) {
                $results['success']++;
            } else {
                $results['failed']++;
                $results['errors'][] = "User {$userId}: " . ($result['error'] ?? $result['message']);
            }
        }
        
        return $results;
    }
    
    public function getUserNotifications($userId, $limit = 50, $offset = 0, $unreadOnly = false) {
        $sql = "
            SELECT id, type, title, message, data, priority, read_at, created_at
            FROM notifications 
            WHERE user_id = ?
        ";
        
        $params = [$userId];
        
        if ($unreadOnly) {
            $sql .= " AND read_at IS NULL";
        }
        
        $sql .= " ORDER BY priority DESC, created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Decode JSON data
        foreach ($notifications as &$notification) {
            $notification['data'] = json_decode($notification['data'], true) ?: null;
        }
        
        return $notifications;
    }
    
    public function markAsRead($notificationId, $userId = null) {
        $sql = "UPDATE notifications SET read_at = NOW() WHERE id = ?";
        $params = [$notificationId];
        
        if ($userId) {
            $sql .= " AND user_id = ?";
            $params[] = $userId;
        }
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        return [
            'success' => true,
            'marked_read' => $stmt->rowCount()
        ];
    }
    
    public function markAllAsRead($userId) {
        $stmt = $this->pdo->prepare("
            UPDATE notifications 
            SET read_at = NOW() 
            WHERE user_id = ? AND read_at IS NULL
        ");
        
        $stmt->execute([$userId]);
        
        return [
            'success' => true,
            'marked_read' => $stmt->rowCount()
        ];
    }
    
    public function getUnreadCount($userId) {
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as unread_count 
            FROM notifications 
            WHERE user_id = ? AND read_at IS NULL
        ");
        
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (int) $result['unread_count'];
    }
    
    public function deleteNotification($notificationId, $userId = null) {
        $sql = "DELETE FROM notifications WHERE id = ?";
        $params = [$notificationId];
        
        if ($userId) {
            $sql .= " AND user_id = ?";
            $params[] = $userId;
        }
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        return [
            'success' => true,
            'deleted' => $stmt->rowCount()
        ];
    }
    
    public function registerPushToken($userId, $token, $platform, $deviceInfo = null) {
        $stmt = $this->pdo->prepare("
            INSERT INTO push_tokens (user_id, token, platform, device_info) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            platform = VALUES(platform),
            device_info = VALUES(device_info),
            is_active = 1,
            updated_at = NOW()
        ");
        
        $stmt->execute([$userId, $token, $platform, json_encode($deviceInfo)]);
        
        return ['success' => true, 'message' => 'Push token registered'];
    }
    
    public function unregisterPushToken($userId, $token) {
        $stmt = $this->pdo->prepare("
            UPDATE push_tokens 
            SET is_active = 0, updated_at = NOW() 
            WHERE user_id = ? AND token = ?
        ");
        
        $stmt->execute([$userId, $token]);
        
        return ['success' => true, 'message' => 'Push token unregistered'];
    }
    
    private function shouldSendNotification($userId, $type) {
        $stmt = $this->pdo->prepare("
            SELECT preferences FROM notification_preferences WHERE user_id = ?
        ");
        
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            // Default preferences - allow all notifications
            return true;
        }
        
        $preferences = json_decode($result['preferences'], true);
        
        // Check if this type is disabled
        return !($preferences['disabled_types'][$type] ?? false);
    }
    
    private function sendPushNotification($userId, $notificationId, $title, $message, $data, $priority) {
        if (!$this->pushNotificationKey) {
            return;
        }
        
        // Get user's push tokens
        $stmt = $this->pdo->prepare("
            SELECT token, platform FROM push_tokens 
            WHERE user_id = ? AND is_active = 1
        ");
        
        $stmt->execute([$userId]);
        $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($tokens as $tokenData) {
            $result = $this->sendPushToToken($tokenData['token'], $tokenData['platform'], $title, $message, $data, $priority);
            
            // Log the attempt
            $this->logNotificationDelivery($notificationId, 'push', $result['status'], $result['error'] ?? null);
        }
    }
    
    private function sendPushToToken($token, $platform, $title, $message, $data, $priority) {
        // This is a simplified implementation
        // In production, you would use Firebase Cloud Messaging or similar service
        
        $payload = [
            'to' => $token,
            'notification' => [
                'title' => $title,
                'body' => $message,
                'priority' => $priority === 'urgent' ? 'high' : 'normal'
            ],
            'data' => $data ?? []
        ];
        
        $ch = curl_init('https://fcm.googleapis.com/fcm/send');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'Authorization: key=' . $this->pushNotificationKey,
                'Content-Type: application/json'
            ],
            CURLOPT_TIMEOUT => 10
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return ['status' => 'failed', 'error' => $error];
        }
        
        $result = json_decode($response, true);
        
        if ($httpCode === 200 && ($result['success'] ?? 0) > 0) {
            return ['status' => 'sent'];
        } else {
            return [
                'status' => 'failed',
                'error' => $result['error'] ?? 'Unknown error'
            ];
        }
    }
    
    private function sendEmailNotification($userId, $notificationId, $title, $message, $data) {
        // Get user's email
        $stmt = $this->pdo->prepare("SELECT email, username FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !$user['email']) {
            return;
        }
        
        // This is a simplified email implementation
        // In production, you would use a proper email service
        
        $subject = "AKM GenZ - {$title}";
        $emailBody = "
            <h2>{$title}</h2>
            <p>Hi {$user['username']},</p>
            <p>{$message}</p>
            <p>Best regards,<br>AKM GenZ Team</p>
        ";
        
        // Log the email attempt (simplified)
        $this->logNotificationDelivery($notificationId, 'email', 'sent', null);
    }
    
    private function logNotificationDelivery($notificationId, $method, $status, $error = null) {
        $stmt = $this->pdo->prepare("
            INSERT INTO notification_logs 
            (notification_id, delivery_method, status, error_message) 
            VALUES (?, ?, ?, ?)
        ");
        
        $stmt->execute([$notificationId, $method, $status, $error]);
    }
    
    public function updateNotificationPreferences($userId, $preferences) {
        $stmt = $this->pdo->prepare("
            INSERT INTO notification_preferences (user_id, preferences) 
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE preferences = VALUES(preferences), updated_at = NOW()
        ");
        
        $stmt->execute([$userId, json_encode($preferences)]);
        
        return ['success' => true, 'message' => 'Preferences updated'];
    }
    
    public function getNotificationPreferences($userId) {
        $stmt = $this->pdo->prepare("
            SELECT preferences FROM notification_preferences WHERE user_id = ?
        ");
        
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            return json_decode($result['preferences'], true);
        }
        
        // Default preferences
        return [
            'disabled_types' => [],
            'push_enabled' => true,
            'email_enabled' => true,
            'quiet_hours' => [
                'enabled' => false,
                'start' => '22:00',
                'end' => '08:00'
            ]
        ];
    }
    
    public function getNotificationStats($userId = null) {
        if ($userId) {
            $stmt = $this->pdo->prepare("
                SELECT 
                    type,
                    COUNT(*) as total,
                    COUNT(CASE WHEN read_at IS NULL THEN 1 END) as unread,
                    AVG(CASE WHEN read_at IS NOT NULL 
                        THEN TIMESTAMPDIFF(SECOND, created_at, read_at) 
                        ELSE NULL END) as avg_read_time
                FROM notifications 
                WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY type
            ");
            
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $stmt = $this->pdo->prepare("
                SELECT 
                    type,
                    COUNT(*) as total,
                    COUNT(CASE WHEN read_at IS NULL THEN 1 END) as unread,
                    AVG(CASE WHEN read_at IS NOT NULL 
                        THEN TIMESTAMPDIFF(SECOND, created_at, read_at) 
                        ELSE NULL END) as avg_read_time
                FROM notifications 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY type
            ");
            
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    public function cleanupOldNotifications($daysOld = 90) {
        $stmt = $this->pdo->prepare("
            DELETE FROM notifications 
            WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY) AND read_at IS NOT NULL
        ");
        
        $stmt->execute([$daysOld]);
        
        return [
            'success' => true,
            'deleted' => $stmt->rowCount()
        ];
    }
}

// API endpoints
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? 'create';
        
        $notificationSystem = new NotificationSystem($pdo);
        
        switch ($action) {
            case 'create':
                $userId = intval($data['user_id'] ?? 0);
                $type = $data['type'] ?? '';
                $title = $data['title'] ?? '';
                $message = $data['message'] ?? '';
                $notificationData = $data['data'] ?? null;
                $priority = $data['priority'] ?? 'normal';
                
                if (!$userId || !$type || !$title || !$message) {
                    throw new Exception('User ID, type, title, and message are required');
                }
                
                $result = $notificationSystem->createNotification($userId, $type, $title, $message, $notificationData, $priority);
                echo json_encode($result);
                break;
                
            case 'bulk_create':
                $userIds = $data['user_ids'] ?? [];
                $type = $data['type'] ?? '';
                $title = $data['title'] ?? '';
                $message = $data['message'] ?? '';
                $notificationData = $data['data'] ?? null;
                $priority = $data['priority'] ?? 'normal';
                
                if (empty($userIds) || !$type || !$title || !$message) {
                    throw new Exception('User IDs, type, title, and message are required');
                }
                
                $result = $notificationSystem->createBulkNotifications($userIds, $type, $title, $message, $notificationData, $priority);
                echo json_encode($result);
                break;
                
            case 'mark_read':
                $notificationId = intval($data['notification_id'] ?? 0);
                $userId = intval($data['user_id'] ?? null);
                
                if (!$notificationId) {
                    throw new Exception('Notification ID is required');
                }
                
                $result = $notificationSystem->markAsRead($notificationId, $userId);
                echo json_encode($result);
                break;
                
            case 'mark_all_read':
                $userId = intval($data['user_id'] ?? 0);
                
                if (!$userId) {
                    throw new Exception('User ID is required');
                }
                
                $result = $notificationSystem->markAllAsRead($userId);
                echo json_encode($result);
                break;
                
            case 'register_token':
                $userId = intval($data['user_id'] ?? 0);
                $token = $data['token'] ?? '';
                $platform = $data['platform'] ?? '';
                $deviceInfo = $data['device_info'] ?? null;
                
                if (!$userId || !$token || !$platform) {
                    throw new Exception('User ID, token, and platform are required');
                }
                
                $result = $notificationSystem->registerPushToken($userId, $token, $platform, $deviceInfo);
                echo json_encode($result);
                break;
                
            case 'update_preferences':
                $userId = intval($data['user_id'] ?? 0);
                $preferences = $data['preferences'] ?? [];
                
                if (!$userId || empty($preferences)) {
                    throw new Exception('User ID and preferences are required');
                }
                
                $result = $notificationSystem->updateNotificationPreferences($userId, $preferences);
                echo json_encode($result);
                break;
                
            default:
                throw new Exception('Invalid action');
        }
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $action = $_GET['action'] ?? 'list';
        $notificationSystem = new NotificationSystem($pdo);
        
        switch ($action) {
            case 'list':
                $userId = intval($_GET['user_id'] ?? 0);
                $limit = intval($_GET['limit'] ?? 50);
                $offset = intval($_GET['offset'] ?? 0);
                $unreadOnly = $_GET['unread_only'] === 'true';
                
                if (!$userId) {
                    throw new Exception('User ID is required');
                }
                
                $notifications = $notificationSystem->getUserNotifications($userId, $limit, $offset, $unreadOnly);
                echo json_encode(['success' => true, 'data' => $notifications]);
                break;
                
            case 'unread_count':
                $userId = intval($_GET['user_id'] ?? 0);
                
                if (!$userId) {
                    throw new Exception('User ID is required');
                }
                
                $count = $notificationSystem->getUnreadCount($userId);
                echo json_encode(['success' => true, 'unread_count' => $count]);
                break;
                
            case 'preferences':
                $userId = intval($_GET['user_id'] ?? 0);
                
                if (!$userId) {
                    throw new Exception('User ID is required');
                }
                
                $preferences = $notificationSystem->getNotificationPreferences($userId);
                echo json_encode(['success' => true, 'data' => $preferences]);
                break;
                
            case 'stats':
                $userId = intval($_GET['user_id'] ?? null);
                $stats = $notificationSystem->getNotificationStats($userId);
                echo json_encode(['success' => true, 'data' => $stats]);
                break;
                
            default:
                throw new Exception('Invalid action');
        }
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $action = $_GET['action'] ?? 'delete';
        $notificationSystem = new NotificationSystem($pdo);
        
        switch ($action) {
            case 'delete':
                $notificationId = intval($_GET['notification_id'] ?? 0);
                $userId = intval($_GET['user_id'] ?? null);
                
                if (!$notificationId) {
                    throw new Exception('Notification ID is required');
                }
                
                $result = $notificationSystem->deleteNotification($notificationId, $userId);
                echo json_encode($result);
                break;
                
            default:
                throw new Exception('Invalid action');
        }
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
    
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
