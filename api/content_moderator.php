<?php
header('Content-Type: application/json');
require 'config.php';

class ContentModerator {
    private $pdo;
    private $visionApiKey = null; // Add your Google Vision API key
    private $moderationThreshold = 0.6; // 60% confidence threshold
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function moderateImage($imagePath) {
        // Google Vision API integration for adult content detection
        $result = $this->analyzeWithGoogleVision($imagePath);
        
        if ($result['adult_likelihood'] >= $this->moderationThreshold) {
            return [
                'approved' => false,
                'reason' => 'Adult content detected',
                'confidence' => $result['adult_likelihood']
            ];
        }
        
        if ($result['violence_likelihood'] >= $this->moderationThreshold) {
            return [
                'approved' => false,
                'reason' => 'Violent content detected',
                'confidence' => $result['violence_likelihood']
            ];
        }
        
        if ($result['racy_likelihood'] >= $this->moderationThreshold) {
            return [
                'approved' => false,
                'reason' => 'Inappropriate content detected',
                'confidence' => $result['racy_likelihood']
            ];
        }
        
        return ['approved' => true, 'confidence' => 1.0];
    }
    
    private function analyzeWithGoogleVision($imagePath) {
        // This is a placeholder for Google Vision API integration
        // In production, you would use the actual Google Cloud Vision API
        
        // For demo purposes, return safe defaults
        return [
            'adult_likelihood' => 0.1,
            'violence_likelihood' => 0.1,
            'racy_likelihood' => 0.1
        ];
        
        /* Actual implementation would look like:
        $imageContent = file_get_contents($imagePath);
        $imageBase64 = base64_encode($imageContent);
        
        $data = [
            'requests' => [
                [
                    'image' => [
                        'content' => $imageBase64
                    ],
                    'features' => [
                        ['type' => 'SAFE_SEARCH_DETECTION'],
                        ['type' => 'LABEL_DETECTION'],
                        ['type' => 'WEB_DETECTION']
                    ]
                ]
            ]
        ];
        
        $ch = curl_init('https://vision.googleapis.com/v1/images:annotate?key=' . $this->visionApiKey);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $result = json_decode($response, true);
        
        // Process the response and return likelihood scores
        */
    }
    
    public function moderateText($text) {
        // Check for SARA (Suku, Agama, Ras, Antar-golongan) content
        $sensitivePatterns = [
            // Racial/ethnic slurs
            '/\b(nigger|kike|spic|chink|gook|wetback)\b/i',
            
            // Religious hate speech
            '/\b(kafir|infidel|heretic|blasphemy)\b/i',
            
            // Discriminatory language
            '/\b(discriminat|segregat|apartheid|genocide)\b/i',
            
            // Indonesian specific terms
            '/\b(kafir|murtad|sesat|bid[\'"]ah)\b/i',
            
            // Hate speech patterns
            '/\b(hate|benci|tolak|usir)\s+(.*?)(muslim|kristen|hindu|budha|konghucu)/i',
        ];
        
        foreach ($sensitivePatterns as $pattern) {
            if (preg_match($pattern, $text)) {
                return [
                    'approved' => false,
                    'reason' => 'Potentially sensitive content detected',
                    'pattern_matched' => $pattern
                ];
            }
        }
        
        // Check for spam patterns
        $spamPatterns = [
            '/(http|https):\/\/[^\s]+/i', // URLs
            '/\b(buy|sell|discount|promo|offer)\b/i', // Commercial content
            '/(.)\1{4,}/', // Repeated characters
        ];
        
        $spamScore = 0;
        foreach ($spamPatterns as $pattern) {
            if (preg_match_all($pattern, $text, $matches)) {
                $spamScore += count($matches[0]);
            }
        }
        
        if ($spamScore > 3) {
            return [
                'approved' => false,
                'reason' => 'Spam content detected',
                'spam_score' => $spamScore
            ];
        }
        
        return ['approved' => true, 'spam_score' => $spamScore];
    }
    
    public function logModerationResult($filePath, $result, $moderatorType = 'auto') {
        $stmt = $this->pdo->prepare("
            INSERT INTO content_moderation_log 
            (file_path, approved, reason, confidence, moderator_type, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $filePath,
            $result['approved'] ? 1 : 0,
            $result['reason'] ?? null,
            $result['confidence'] ?? null,
            $moderatorType
        ]);
    }
    
    public function updateReviewQueue($filePath, $status, $reviewerId = null, $notes = null) {
        $stmt = $this->pdo->prepare("
            UPDATE content_review_queue 
            SET status = ?, reviewed_by = ?, review_notes = ?, updated_at = NOW()
            WHERE file_path = ?
        ");
        
        $stmt->execute([$status, $reviewerId, $notes, $filePath]);
    }
}

// API endpoints
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? null;
        
        $moderator = new ContentModerator($pdo);
        
        switch ($action) {
            case 'moderate_image':
                $imagePath = $data['image_path'] ?? null;
                if (!$imagePath || !file_exists($imagePath)) {
                    throw new Exception('Invalid image path');
                }
                
                $result = $moderator->moderateImage($imagePath);
                $moderator->logModerationResult($imagePath, $result);
                
                if (!$result['approved']) {
                    $moderator->updateReviewQueue($imagePath, 'rejected', null, $result['reason']);
                } else {
                    $moderator->updateReviewQueue($imagePath, 'approved');
                }
                
                echo json_encode(['success' => true, 'result' => $result]);
                break;
                
            case 'moderate_text':
                $text = $data['text'] ?? '';
                $result = $moderator->moderateText($text);
                
                echo json_encode(['success' => true, 'result' => $result]);
                break;
                
            case 'manual_review':
                $filePath = $data['file_path'] ?? null;
                $status = $data['status'] ?? null; // approved/rejected
                $reviewerId = $data['reviewer_id'] ?? null;
                $notes = $data['notes'] ?? null;
                
                if (!$filePath || !$status) {
                    throw new Exception('File path and status are required');
                }
                
                $moderator->updateReviewQueue($filePath, $status, $reviewerId, $notes);
                
                echo json_encode(['success' => true, 'message' => 'Review completed']);
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
