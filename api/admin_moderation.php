<?php
header('Content-Type: application/json');
require 'config.php';

class AdminModeration {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function getReportedPosts($status = 'pending', $limit = 50, $offset = 0) {
        $stmt = $this->pdo->prepare("
            SELECT p.*, u.username, u.profile_image,
                   COUNT(r.id) as report_count,
                   GROUP_CONCAT(r.reason SEPARATOR ', ') as report_reasons,
                   r.created_at as latest_report
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN post_reports r ON p.id = r.post_id
            WHERE r.status = :status OR r.status IS NULL
            GROUP BY p.id
            ORDER BY latest_report DESC, report_count DESC
            LIMIT :limit OFFSET :offset
        ");
        
        $stmt->bindValue(':status', $status);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getPostDetails($postId) {
        $stmt = $this->pdo->prepare("
            SELECT p.*, u.username, u.profile_image, u.email,
                   GROUP_CONCAT(
                       CONCAT(pm.media_url, '|', pm.media_type, '|', pm.sort_order) 
                       ORDER BY pm.sort_order
                       SEPARATOR ';;'
                   ) as media_files,
                   (SELECT COUNT(*) FROM post_reports WHERE post_id = p.id) as report_count,
                   (SELECT GROUP_CONCAT(reason, ' (', created_at, ')') 
                    FROM post_reports WHERE post_id = p.id) as report_details
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN post_media pm ON p.id = pm.post_id
            WHERE p.id = ?
            GROUP BY p.id
        ");
        
        $stmt->execute([$postId]);
        $post = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($post && $post['media_files']) {
            $mediaFiles = [];
            $files = explode(';;', $post['media_files']);
            
            foreach ($files as $file) {
                $parts = explode('|', $file);
                if (count($parts) >= 3) {
                    $mediaFiles[] = [
                        'url' => $parts[0],
                        'type' => $parts[1],
                        'sort_order' => $parts[2]
                    ];
                }
            }
            
            $post['media_files'] = $mediaFiles;
        }
        
        return $post;
    }
    
    public function takedownPost($postId, $adminId, $reason, $action = 'remove') {
        try {
            $this->pdo->beginTransaction();
            
            // Log the takedown action
            $stmt = $this->pdo->prepare("
                INSERT INTO admin_actions 
                (admin_id, post_id, action, reason, created_at) 
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$adminId, $postId, $action, $reason]);
            
            // Update post status
            if ($action === 'remove') {
                // Soft delete - hide the post
                $stmt = $this->pdo->prepare("
                    UPDATE posts SET status = 'removed', 
                    removed_at = NOW(), 
                    removed_by = ? 
                    WHERE id = ?
                ");
                $stmt->execute([$adminId, $postId]);
                
                // Update all related media files
                $stmt = $this->pdo->prepare("
                    UPDATE post_media SET status = 'removed' 
                    WHERE post_id = ?
                ");
                $stmt->execute([$postId]);
                
            } elseif ($action === 'delete') {
                // Hard delete - remove permanently
                $post = $this->getPostDetails($postId);
                
                // Delete physical files
                if (isset($post['media_files'])) {
                    foreach ($post['media_files'] as $media) {
                        $filePath = $this->getFilePathFromUrl($media['url']);
                        if (file_exists($filePath)) {
                            unlink($filePath);
                        }
                        
                        // Delete compressed and thumbnail versions
                        $compressedPath = str_replace('/uploads/', '/uploads/compressed/', $filePath);
                        $thumbnailPath = str_replace('/uploads/', '/uploads/thumbnails/', $filePath);
                        
                        if (file_exists($compressedPath)) {
                            unlink($compressedPath);
                        }
                        if (file_exists($thumbnailPath)) {
                            unlink($thumbnailPath);
                        }
                    }
                }
                
                // Delete from database
                $stmt = $this->pdo->prepare("DELETE FROM posts WHERE id = ?");
                $stmt->execute([$postId]);
                
                $stmt = $this->pdo->prepare("DELETE FROM post_media WHERE post_id = ?");
                $stmt->execute([$postId]);
            }
            
            // Update report status
            $stmt = $this->pdo->prepare("
                UPDATE post_reports SET status = 'resolved', 
                resolved_by = ?, resolved_at = NOW() 
                WHERE post_id = ?
            ");
            $stmt->execute([$adminId, $postId]);
            
            // Notify the post owner
            $this->notifyUser($post['user_id'], $action, $reason);
            
            $this->pdo->commit();
            
            return [
                'success' => true,
                'message' => "Post has been " . ($action === 'remove' ? 'removed' : 'deleted'),
                'action_taken' => $action
            ];
            
        } catch (Exception $e) {
            $this->pdo->rollback();
            throw $e;
        }
    }
    
    public function suspendUser($userId, $adminId, $reason, $duration = null) {
        try {
            $this->pdo->beginTransaction();
            
            // Calculate suspension end date
            $suspensionEnd = $duration ? 
                date('Y-m-d H:i:s', strtotime("+$duration days")) : 
                null;
            
            // Update user status
            $stmt = $this->pdo->prepare("
                UPDATE users SET 
                status = 'suspended',
                suspension_reason = ?,
                suspension_end = ?,
                suspended_by = ?,
                suspended_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$reason, $suspensionEnd, $adminId, $userId]);
            
            // Log the action
            $stmt = $this->pdo->prepare("
                INSERT INTO admin_actions 
                (admin_id, user_id, action, reason, details, created_at) 
                VALUES (?, ?, 'suspend_user', ?, ?, NOW())
            ");
            $stmt->execute([$adminId, $userId, $reason, json_encode([
                'duration' => $duration,
                'suspension_end' => $suspensionEnd
            ])]);
            
            // Remove all active posts by this user
            $stmt = $this->pdo->prepare("
                UPDATE posts SET status = 'removed', 
                removed_at = NOW(), 
                removed_by = ? 
                WHERE user_id = ? AND status = 'active'
            ");
            $stmt->execute([$adminId, $userId]);
            
            $this->pdo->commit();
            
            return [
                'success' => true,
                'message' => 'User has been suspended',
                'suspension_end' => $suspensionEnd
            ];
            
        } catch (Exception $e) {
            $this->pdo->rollback();
            throw $e;
        }
    }
    
    public function getModerationStats($timeframe = '7 days') {
        $stmt = $this->pdo->prepare("
            SELECT 
                COUNT(*) as total_reports,
                COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_reports,
                COUNT(CASE WHEN r.status = 'resolved' THEN 1 END) as resolved_reports,
                COUNT(CASE WHEN a.action = 'remove' THEN 1 END) as posts_removed,
                COUNT(CASE WHEN a.action = 'delete' THEN 1 END) as posts_deleted,
                COUNT(CASE WHEN a.action = 'suspend_user' THEN 1 END) as users_suspended
            FROM post_reports r
            LEFT JOIN admin_actions a ON a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ");
        
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    private function getFilePathFromUrl($url) {
        $parsedUrl = parse_url($url);
        $path = $parsedUrl['path'];
        // Convert URL path to file system path
        return '..' . str_replace('/AKM.2.0', '', $path);
    }
    
    private function notifyUser($userId, $action, $reason) {
        // Create notification for the user
        $message = match($action) {
            'remove' => 'Your post has been removed for violating community guidelines',
            'delete' => 'Your post has been permanently deleted for serious violations',
            default => 'Action has been taken on your post'
        };
        
        $stmt = $this->pdo->prepare("
            INSERT INTO notifications 
            (user_id, type, title, message, data, created_at) 
            VALUES (?, 'moderation', 'Post Moderation', ?, ?, NOW())
        ");
        
        $stmt->execute([$userId, $message, json_encode([
            'action' => $action,
            'reason' => $reason
        ])]);
    }
}

// API endpoints
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Check admin permissions
        $adminId = $_GET['admin_id'] ?? null;
        if (!$adminId) {
            http_response_code(401);
            echo json_encode(['error' => 'Admin authentication required']);
            exit;
        }
        
        $moderation = new AdminModeration($pdo);
        $action = $_GET['action'] ?? 'reports';
        
        switch ($action) {
            case 'reports':
                $status = $_GET['status'] ?? 'pending';
                $limit = intval($_GET['limit'] ?? 50);
                $offset = intval($_GET['offset'] ?? 0);
                
                $reports = $moderation->getReportedPosts($status, $limit, $offset);
                echo json_encode(['success' => true, 'data' => $reports]);
                break;
                
            case 'post_details':
                $postId = intval($_GET['post_id'] ?? 0);
                if (!$postId) {
                    throw new Exception('Post ID is required');
                }
                
                $details = $moderation->getPostDetails($postId);
                echo json_encode(['success' => true, 'data' => $details]);
                break;
                
            case 'stats':
                $timeframe = $_GET['timeframe'] ?? '7 days';
                $stats = $moderation->getModerationStats($timeframe);
                echo json_encode(['success' => true, 'data' => $stats]);
                break;
                
            default:
                throw new Exception('Invalid action');
        }
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        $adminId = $data['admin_id'] ?? null;
        
        if (!$adminId) {
            http_response_code(401);
            echo json_encode(['error' => 'Admin authentication required']);
            exit;
        }
        
        $moderation = new AdminModeration($pdo);
        $action = $data['action'] ?? null;
        
        switch ($action) {
            case 'takedown':
                $postId = intval($data['post_id'] ?? 0);
                $reason = $data['reason'] ?? '';
                $takedownAction = $data['takedown_action'] ?? 'remove'; // remove or delete
                
                if (!$postId || empty($reason)) {
                    throw new Exception('Post ID and reason are required');
                }
                
                $result = $moderation->takedownPost($postId, $adminId, $reason, $takedownAction);
                echo json_encode(['success' => true, 'data' => $result]);
                break;
                
            case 'suspend_user':
                $userId = intval($data['user_id'] ?? 0);
                $reason = $data['reason'] ?? '';
                $duration = intval($data['duration'] ?? 7); // days
                
                if (!$userId || empty($reason)) {
                    throw new Exception('User ID and reason are required');
                }
                
                $result = $moderation->suspendUser($userId, $adminId, $reason, $duration);
                echo json_encode(['success' => true, 'data' => $result]);
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
