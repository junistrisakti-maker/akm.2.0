<?php
header('Content-Type: application/json');
require 'config.php';

class PostReporter {
    private $pdo;
    private $reportReasons = [
        'spam' => 'Spam or misleading content',
        'inappropriate' => 'Inappropriate content',
        'violence' => 'Violent or graphic content',
        'copyright' => 'Copyright violation',
        'harassment' => 'Harassment or bullying',
        'hate_speech' => 'Hate speech or discrimination',
        'other' => 'Other'
    ];
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function reportPost($postId, $reporterId, $reason, $description = '') {
        try {
            // Check if post exists
            $stmt = $this->pdo->prepare("SELECT id FROM posts WHERE id = ? AND status = 'active'");
            $stmt->execute([$postId]);
            
            if (!$stmt->fetch()) {
                throw new Exception('Post not found or already removed');
            }
            
            // Check if user already reported this post
            $stmt = $this->pdo->prepare("
                SELECT id FROM post_reports 
                WHERE post_id = ? AND reporter_id = ?
            ");
            $stmt->execute([$postId, $reporterId]);
            
            if ($stmt->fetch()) {
                throw new Exception('You have already reported this post');
            }
            
            // Create report
            $stmt = $this->pdo->prepare("
                INSERT INTO post_reports 
                (post_id, reporter_id, reason, description, created_at) 
                VALUES (?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([$postId, $reporterId, $reason, $description]);
            
            $reportId = $this->pdo->lastInsertId();
            
            // Check if this post needs immediate review (multiple reports)
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as report_count 
                FROM post_reports 
                WHERE post_id = ? AND status = 'pending'
            ");
            $stmt->execute([$postId]);
            $reportCount = $stmt->fetch()['report_count'];
            
            // Auto-flag for admin review if 3+ reports
            if ($reportCount >= 3) {
                $this->flagForImmediateReview($postId, $reportCount);
            }
            
            return [
                'success' => true,
                'report_id' => $reportId,
                'message' => 'Post reported successfully',
                'report_count' => $reportCount,
                'auto_review' => $reportCount >= 3
            ];
            
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    private function flagForImmediateReview($postId, $reportCount) {
        // Update post status to flag for immediate review
        $stmt = $this->pdo->prepare("
            UPDATE posts SET status = 'review_pending' 
            WHERE id = ?
        ");
        $stmt->execute([$postId]);
        
        // Create high-priority notification for admins
        $stmt = $this->pdo->prepare("
            INSERT INTO notifications 
            (user_id, type, title, message, priority, data, created_at) 
            SELECT id, 'admin_review', 'High Priority Review', 
            'Post has received ' || ? || ' reports and requires immediate review', 
            'high', JSON_OBJECT('post_id', ?, 'report_count', ?), NOW()
            FROM users 
            WHERE role = 'admin'
        ");
        $stmt->execute([$reportCount, $postId, $reportCount]);
    }
    
    public function getReportReasons() {
        return $this->reportReasons;
    }
    
    public function getUserReports($userId, $limit = 20, $offset = 0) {
        $stmt = $this->pdo->prepare("
            SELECT pr.*, p.caption, p.url as post_url,
                   u.username as reported_user,
                   pr.created_at as report_date
            FROM post_reports pr
            JOIN posts p ON pr.post_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE pr.reporter_id = ?
            ORDER BY pr.created_at DESC
            LIMIT ? OFFSET ?
        ");
        
        $stmt->execute([$userId, $limit, $offset]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// API endpoints
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $postId = intval($data['post_id'] ?? 0);
        $reporterId = intval($data['reporter_id'] ?? 0);
        $reason = $data['reason'] ?? '';
        $description = $data['description'] ?? '';
        
        if (!$postId || !$reporterId || empty($reason)) {
            http_response_code(400);
            echo json_encode(['error' => 'Post ID, reporter ID, and reason are required']);
            exit;
        }
        
        $reporter = new PostReporter($pdo);
        $result = $reporter->reportPost($postId, $reporterId, $reason, $description);
        
        echo json_encode($result);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $action = $_GET['action'] ?? 'reasons';
        $reporter = new PostReporter($pdo);
        
        switch ($action) {
            case 'reasons':
                echo json_encode([
                    'success' => true,
                    'reasons' => $reporter->getReportReasons()
                ]);
                break;
                
            case 'my_reports':
                $userId = intval($_GET['user_id'] ?? 0);
                if (!$userId) {
                    throw new Exception('User ID is required');
                }
                
                $limit = intval($_GET['limit'] ?? 20);
                $offset = intval($_GET['offset'] ?? 0);
                
                $reports = $reporter->getUserReports($userId, $limit, $offset);
                echo json_encode(['success' => true, 'data' => $reports]);
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
