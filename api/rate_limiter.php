<?php
header('Content-Type: application/json');
require 'config.php';

class RateLimiter {
    private $pdo;
    private $limits = [
        'upload' => [
            'requests_per_minute' => 10,
            'requests_per_hour' => 100,
            'requests_per_day' => 500,
            'size_per_hour' => 500 * 1024 * 1024, // 500MB per hour
            'size_per_day' => 2 * 1024 * 1024 * 1024 // 2GB per day
        ],
        'post' => [
            'requests_per_minute' => 5,
            'requests_per_hour' => 50,
            'requests_per_day' => 200
        ],
        'report' => [
            'requests_per_minute' => 3,
            'requests_per_hour' => 30,
            'requests_per_day' => 100
        ],
        'comment' => [
            'requests_per_minute' => 20,
            'requests_per_hour' => 200,
            'requests_per_day' => 1000
        ],
        'like' => [
            'requests_per_minute' => 30,
            'requests_per_hour' => 500,
            'requests_per_day' => 2000
        ]
    ];
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->createRateLimitTable();
    }
    
    private function createRateLimitTable() {
        $sql = "
            CREATE TABLE IF NOT EXISTS rate_limits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                action_type VARCHAR(20) NOT NULL,
                window_type ENUM('minute', 'hour', 'day') NOT NULL,
                request_count INT DEFAULT 0,
                total_size BIGINT DEFAULT 0,
                window_start TIMESTAMP NOT NULL,
                window_end TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_window (user_id, action_type, window_type, window_start),
                INDEX idx_user_action (user_id, action_type),
                INDEX idx_window_end (window_end)
            )
        ";
        
        $this->pdo->exec($sql);
    }
    
    public function checkRateLimit($userId, $actionType, $requestSize = 0) {
        if (!isset($this->limits[$actionType])) {
            return ['allowed' => true, 'reason' => 'No rate limit for this action'];
        }
        
        $limits = $this->limits[$actionType];
        $now = date('Y-m-d H:i:s');
        
        // Check each time window
        $windows = [
            'minute' => [
                'start' => date('Y-m-d H:i:00', strtotime('-1 minute')),
                'end' => date('Y-m-d H:i:59', strtotime('+1 minute')),
                'limit' => $limits['requests_per_minute'] ?? null,
                'size_limit' => $limits['size_per_minute'] ?? null
            ],
            'hour' => [
                'start' => date('Y-m-d H:00:00', strtotime('-1 hour')),
                'end' => date('Y-m-d H:59:59', strtotime('+1 hour')),
                'limit' => $limits['requests_per_hour'] ?? null,
                'size_limit' => $limits['size_per_hour'] ?? null
            ],
            'day' => [
                'start' => date('Y-m-d 00:00:00', strtotime('-1 day')),
                'end' => date('Y-m-d 23:59:59', strtotime('+1 day')),
                'limit' => $limits['requests_per_day'] ?? null,
                'size_limit' => $limits['size_per_day'] ?? null
            ]
        ];
        
        foreach ($windows as $windowType => $window) {
            $result = $this->checkWindow($userId, $actionType, $windowType, $window, $requestSize);
            
            if (!$result['allowed']) {
                return $result;
            }
        }
        
        // Record the request
        $this->recordRequest($userId, $actionType, $requestSize);
        
        return ['allowed' => true, 'reason' => 'Request allowed'];
    }
    
    private function checkWindow($userId, $actionType, $windowType, $window, $requestSize) {
        // Get or create the window record
        $stmt = $this->pdo->prepare("
            SELECT request_count, total_size 
            FROM rate_limits 
            WHERE user_id = ? AND action_type = ? AND window_type = ? AND window_start = ?
        ");
        
        $stmt->execute([$userId, $actionType, $windowType, $window['start']]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$record) {
            // Create new window record
            $stmt = $this->pdo->prepare("
                INSERT INTO rate_limits 
                (user_id, action_type, window_type, window_start, window_end, request_count, total_size) 
                VALUES (?, ?, ?, ?, ?, 1, ?)
            ");
            
            $stmt->execute([$userId, $actionType, $windowType, $window['start'], $window['end'], $requestSize]);
            
            $currentCount = 1;
            $currentSize = $requestSize;
        } else {
            $currentCount = $record['request_count'] + 1;
            $currentSize = $record['total_size'] + $requestSize;
            
            // Update existing record
            $stmt = $this->pdo->prepare("
                UPDATE rate_limits 
                SET request_count = request_count + 1, total_size = total_size + ?, updated_at = NOW()
                WHERE user_id = ? AND action_type = ? AND window_type = ? AND window_start = ?
            ");
            
            $stmt->execute([$requestSize, $userId, $actionType, $windowType, $window['start']]);
        }
        
        // Check request count limit
        if ($window['limit'] && $currentCount > $window['limit']) {
            return [
                'allowed' => false,
                'reason' => "Rate limit exceeded for {$actionType}. Maximum {$window['limit']} requests per {$windowType}.",
                'current' => $currentCount,
                'limit' => $window['limit'],
                'window_type' => $windowType,
                'retry_after' => $this->getRetryAfter($window['end'])
            ];
        }
        
        // Check size limit
        if ($window['size_limit'] && $currentSize > $window['size_limit']) {
            return [
                'allowed' => false,
                'reason' => "Size limit exceeded for {$actionType}. Maximum " . $this->formatBytes($window['size_limit']) . " per {$windowType}.",
                'current_size' => $currentSize,
                'size_limit' => $window['size_limit'],
                'window_type' => $windowType,
                'retry_after' => $this->getRetryAfter($window['end'])
            ];
        }
        
        return ['allowed' => true];
    }
    
    private function recordRequest($userId, $actionType, $requestSize) {
        // This is handled in checkWindow method
        // Keeping this method for potential future enhancements
    }
    
    private function getRetryAfter($windowEnd) {
        $endTime = strtotime($windowEnd);
        $now = time();
        $retryAfter = max(0, $endTime - $now);
        
        return $retryAfter;
    }
    
    private function formatBytes($bytes) {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
    
    public function getUserRateLimitStatus($userId, $actionType = null) {
        $now = date('Y-m-d H:i:s');
        
        if ($actionType) {
            $stmt = $this->pdo->prepare("
                SELECT action_type, window_type, request_count, total_size, window_end,
                       CASE 
                           WHEN window_type = 'minute' AND action_type = 'upload' THEN ? 
                           WHEN window_type = 'hour' AND action_type = 'upload' THEN ?
                           WHEN window_type = 'day' AND action_type = 'upload' THEN ?
                           WHEN window_type = 'minute' THEN ? 
                           WHEN window_type = 'hour' THEN ?
                           WHEN window_type = 'day' THEN ?
                       END as limit_count,
                       CASE 
                           WHEN window_type = 'hour' AND action_type = 'upload' THEN ?
                           WHEN window_type = 'day' AND action_type = 'upload' THEN ?
                           ELSE NULL
                       END as limit_size
                FROM rate_limits 
                WHERE user_id = ? AND action_type = ? AND window_end > ?
                ORDER BY window_type
            ");
            
            $limits = $this->limits[$actionType] ?? [];
            $stmt->execute([
                $limits['requests_per_minute'] ?? null,
                $limits['requests_per_hour'] ?? null,
                $limits['requests_per_day'] ?? null,
                $limits['requests_per_minute'] ?? null,
                $limits['requests_per_hour'] ?? null,
                $limits['requests_per_day'] ?? null,
                $limits['size_per_hour'] ?? null,
                $limits['size_per_day'] ?? null,
                $userId, $actionType, $now
            ]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $stmt = $this->pdo->prepare("
                SELECT action_type, window_type, request_count, total_size, window_end
                FROM rate_limits 
                WHERE user_id = ? AND window_end > ?
                ORDER BY action_type, window_type
            ");
            
            $stmt->execute([$userId, $now]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    public function resetUserRateLimits($userId, $actionType = null) {
        if ($actionType) {
            $stmt = $this->pdo->prepare("
                DELETE FROM rate_limits 
                WHERE user_id = ? AND action_type = ?
            ");
            $stmt->execute([$userId, $actionType]);
        } else {
            $stmt = $this->pdo->prepare("
                DELETE FROM rate_limits 
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
        }
        
        return ['success' => true, 'message' => 'Rate limits reset'];
    }
    
    public function cleanupExpiredWindows() {
        $stmt = $this->pdo->prepare("
            DELETE FROM rate_limits 
            WHERE window_end < NOW() - INTERVAL 1 DAY
        ");
        
        $deleted = $stmt->rowCount();
        
        return ['success' => true, 'deleted_windows' => $deleted];
    }
    
    public function getRateLimitStats() {
        $stmt = $this->pdo->prepare("
            SELECT 
                action_type,
                window_type,
                COUNT(*) as total_windows,
                AVG(request_count) as avg_requests,
                MAX(request_count) as max_requests,
                AVG(total_size) as avg_size,
                MAX(total_size) as max_size
            FROM rate_limits 
            WHERE window_end > NOW() - INTERVAL 1 DAY
            GROUP BY action_type, window_type
            ORDER BY action_type, window_type
        ");
        
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function updateLimits($newLimits) {
        // Validate new limits
        foreach ($newLimits as $actionType => $limits) {
            if (!is_array($limits)) {
                throw new Exception("Invalid limits format for {$actionType}");
            }
            
            // Validate each limit
            foreach (['requests_per_minute', 'requests_per_hour', 'requests_per_day'] as $key) {
                if (isset($limits[$key]) && (!is_numeric($limits[$key]) || $limits[$key] < 0)) {
                    throw new Exception("Invalid {$key} for {$actionType}");
                }
            }
            
            foreach (['size_per_hour', 'size_per_day'] as $key) {
                if (isset($limits[$key]) && (!is_numeric($limits[$key]) || $limits[$key] < 0)) {
                    throw new Exception("Invalid {$key} for {$actionType}");
                }
            }
        }
        
        // Update the limits
        $this->limits = array_merge($this->limits, $newLimits);
        
        // Save to database
        $stmt = $this->pdo->prepare("
            INSERT INTO rate_limit_settings (action_type, limits_json, updated_at) 
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE limits_json = VALUES(limits_json), updated_at = NOW()
        ");
        
        foreach ($newLimits as $actionType => $limits) {
            $stmt->execute([$actionType, json_encode($limits)]);
        }
        
        return ['success' => true, 'message' => 'Rate limits updated'];
    }
}

// Middleware function to check rate limits
function checkRateLimitMiddleware($actionType) {
    return function() use ($actionType) {
        global $pdo;
        
        // Get user ID from session or token
        $userId = $_SESSION['user_id'] ?? $_POST['user_id'] ?? $_GET['user_id'] ?? null;
        
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            exit;
        }
        
        // Get request size for uploads
        $requestSize = 0;
        if ($actionType === 'upload' && isset($_FILES)) {
            foreach ($_FILES as $files) {
                if (is_array($files['size'])) {
                    foreach ($files['size'] as $size) {
                        $requestSize += $size;
                    }
                } else {
                    $requestSize += $files['size'];
                }
            }
        }
        
        $rateLimiter = new RateLimiter($pdo);
        $result = $rateLimiter->checkRateLimit($userId, $actionType, $requestSize);
        
        if (!$result['allowed']) {
            http_response_code(429);
            header('Retry-After: ' . ($result['retry_after'] ?? 60));
            echo json_encode([
                'error' => 'Rate limit exceeded',
                'message' => $result['reason'],
                'retry_after' => $result['retry_after'] ?? 60
            ]);
            exit;
        }
        
        return true;
    };
}

// API endpoints
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $action = $_GET['action'] ?? 'status';
        $rateLimiter = new RateLimiter($pdo);
        
        switch ($action) {
            case 'status':
                $userId = intval($_GET['user_id'] ?? 0);
                $actionType = $_GET['action_type'] ?? null;
                
                if (!$userId) {
                    throw new Exception('User ID is required');
                }
                
                $status = $rateLimiter->getUserRateLimitStatus($userId, $actionType);
                echo json_encode(['success' => true, 'data' => $status]);
                break;
                
            case 'stats':
                $stats = $rateLimiter->getRateLimitStats();
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
        $action = $data['action'] ?? 'check';
        $rateLimiter = new RateLimiter($pdo);
        
        switch ($action) {
            case 'check':
                $userId = intval($data['user_id'] ?? 0);
                $actionType = $data['action_type'] ?? 'upload';
                $requestSize = intval($data['request_size'] ?? 0);
                
                if (!$userId) {
                    throw new Exception('User ID is required');
                }
                
                $result = $rateLimiter->checkRateLimit($userId, $actionType, $requestSize);
                echo json_encode($result);
                break;
                
            case 'reset':
                $userId = intval($data['user_id'] ?? 0);
                $actionType = $data['action_type'] ?? null;
                
                if (!$userId) {
                    throw new Exception('User ID is required');
                }
                
                $result = $rateLimiter->resetUserRateLimits($userId, $actionType);
                echo json_encode($result);
                break;
                
            case 'cleanup':
                $result = $rateLimiter->cleanupExpiredWindows();
                echo json_encode($result);
                break;
                
            case 'update_limits':
                $newLimits = $data['limits'] ?? [];
                
                if (empty($newLimits)) {
                    throw new Exception('Limits array is required');
                }
                
                $result = $rateLimiter->updateLimits($newLimits);
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
