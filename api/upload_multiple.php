<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

ob_start();
require_once 'config.php';

class MediaUploader
{
    private $pdo;
    private $maxFileSize = 50 * 1024 * 1024; // 50MB
    private $allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    private $allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    private $uploadDir = '../uploads/';
    private $maxFiles = 10; // Maximum 10 files per upload

    private function checkSARAContent($text)
    {
        $blockedKeywords = [
            'anjing', 'babi', 'monyet', 'tolol', 'goblok', 'bangsat', 'kontol', 'memek', // Profanity
            'kafir', 'sesat', 'pki', 'teroris', 'radikal', 'komunis', // SARA/Provocative
            'porn', 'bokep', 'telanjang', 'bugil', 'sex', 'bokep' // NSFW
        ];

        $lowerText = strtolower($text);
        foreach ($blockedKeywords as $word) {
            if (strpos($lowerText, $word) !== false) {
                throw new Exception("Content rejected: Caption contains sensitive or inappropriate language ($word).");
            }
        }
        return true;
    }

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0777, true);
        }
    }

    private function generateSecureFileName($originalName, $userId)
    {
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $timestamp = time();
        $random = bin2hex(random_bytes(8));
        return "{$userId}_{$timestamp}_{$random}.{$extension}";
    }

    private function validateFile($file)
    {
        // Check file size
        if ($file['size'] > $this->maxFileSize) {
            throw new Exception("File size exceeds maximum limit of 50MB");
        }

        // Check MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $detectedType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($detectedType, array_merge($this->allowedImageTypes, $this->allowedVideoTypes))) {
            throw new Exception("Invalid file type: $detectedType. Only JPG, PNG, WEBP, MP4, WEBM are allowed");
        }

        // Verify it's actually an image or video (not just renamed file)
        if (in_array($detectedType, $this->allowedImageTypes)) {
            if (!@getimagesize($file['tmp_name'])) {
                throw new Exception("Invalid image file. The file content does not match its extension.");
            }
        }
        else {
            // Basic video validation - require FFmpeg to be installed or use basic checks
            if (filesize($file['tmp_name']) < 100) { // Extremely small file is likely not a real video
                throw new Exception("Invalid video file - file too small");
            }
        }

        return $detectedType;
    }

    private function scanForMalware($filePath)
    {
        // Basic malware scan using PHP's built-in functions
        $content = file_get_contents($filePath);

        // Check for common malicious patterns (PHP shells, script tags, etc.)
        $maliciousPatterns = [
            '/<\?php/i',
            '/<script/i',
            '/javascript:/i',
            '/eval\s*\(/i',
            '/base64_decode/i',
            '/exec\s*\(/i',
            '/system\s*\(/i',
            '/shell_exec/i',
            '/passthru/i',
            '/popen/i',
            '/proc_open/i',
            '/include\s*\(/i',
            '/require\s*\(/i',
            '/upload\s*=\s*/i' // Common in some exploit kits
        ];

        foreach ($maliciousPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                unlink($filePath);
                throw new Exception("Potentially malicious file detected. Security threat blocked.");
            }
        }

        return true;
    }

    private function runModeration($targetPath, $mimeType)
    {
        try {
            // 1. Google Vision Moderation (for images)
            if (in_array($mimeType, $this->allowedImageTypes)) {
                require_once 'google_vision_moderator.php';
                $moderator = new GoogleVisionModerator($this->pdo);
                $result = $moderator->analyzeImage($targetPath);

                if (!$result['success'] || !$result['decision']['approved']) {
                    $reason = implode(', ', $result['reasons'] ?? ['Policy violation']);
                    unlink($targetPath);
                    throw new Exception("Content Moderation: Image rejected ($reason).");
                }
            }

            // 2. Add to review queue for manual verification
            $stmt = $this->pdo->prepare("INSERT INTO content_review_queue (file_path, mime_type, status, created_at) VALUES (?, ?, 'pending', NOW())");
            $stmt->execute([$targetPath, $mimeType]);

            return true;
        }
        catch (Exception $e) {
            if (file_exists($targetPath))
                unlink($targetPath);
            throw $e;
        }
    }

    private function runOptimization($targetPath, $mimeType)
    {
        try {
            require_once 'storage_optimizer.php';
            $optimizer = new StorageOptimizer($this->pdo);

            if (in_array($mimeType, $this->allowedImageTypes)) {
                // Compress and generate thumbnail
                $optimizer->optimizeImage($targetPath, 85);
            }
            else if (in_array($mimeType, $this->allowedVideoTypes)) {
                // For videos, generate thumbnail if video_processor is available
                if (file_exists('video_processor.php')) {
                    require_once 'video_processor.php';
                    $processor = new VideoProcessor($this->pdo);
                    $processor->generateThumbnail($targetPath);
                }
            }
        }
        catch (Exception $e) {
            error_log("Optimization warning: " . $e->getMessage());
        // Don't fail the upload just because optimization failed
        }
    }

    public function uploadFiles($files, $userId, $caption = '')
    {
        // Robust handling of files array
        $uploadedMedia = [];
        $errors = [];

        // Normalize the files array
        $normalizedFiles = [];
        if (is_array($files['files']['name'])) {
            foreach ($files['files']['name'] as $i => $name) {
                $normalizedFiles[] = [
                    'name' => $files['files']['name'][$i],
                    'type' => $files['files']['type'][$i],
                    'tmp_name' => $files['files']['tmp_name'][$i],
                    'error' => $files['files']['error'][$i],
                    'size' => $files['files']['size'][$i]
                ];
            }
        }
        else {
            $normalizedFiles[] = [
                'name' => $files['files']['name'],
                'type' => $files['files']['type'],
                'tmp_name' => $files['files']['tmp_name'],
                'error' => $files['files']['error'],
                'size' => $files['files']['size']
            ];
        }

        if (count($normalizedFiles) > $this->maxFiles) {
            throw new Exception("Maximum {$this->maxFiles} files allowed per upload");
        }

        // Validate caption for SARA content
        if (!empty($caption)) {
            $this->checkSARAContent($caption);
        }

        foreach ($normalizedFiles as $index => $file) {
            try {
                if ($file['error'] !== UPLOAD_ERR_OK) {
                    throw new Exception("Upload failed with error code: " . $file['error']);
                }

                $mimeType = $this->validateFile($file);
                $secureName = $this->generateSecureFileName($file['name'], $userId);
                $targetPath = $this->uploadDir . $secureName;

                if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
                    throw new Exception("Critical: Failed to store file on server.");
                }

                // Security checks
                $this->scanForMalware($targetPath);

                // Moderation
                $this->runModeration($targetPath, $mimeType);

                // Optimization
                $this->runOptimization($targetPath, $mimeType);

                // Prepare response data
                $url = BASE_URL . "/uploads/" . $secureName;

                $uploadedMedia[] = [
                    'url' => $url,
                    'type' => in_array($mimeType, $this->allowedImageTypes) ? 'image' : 'video',
                    'size' => filesize($targetPath),
                    'original_name' => $file['name']
                ];

            }
            catch (Exception $e) {
                $errors[] = "File '$file[name]': " . $e->getMessage();
            }
        }

        if (empty($uploadedMedia) && !empty($errors)) {
            throw new Exception(implode("\n", $errors));
        }

        return [
            'files' => $uploadedMedia,
            'errors' => $errors,
            'total_uploaded' => count($uploadedMedia),
            'total_failed' => count($errors)
        ];
    }
}

// Handle the request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Debug: Log what we received
        error_log("FILES data: " . print_r($_FILES, true));
        error_log("POST data: " . print_r($_POST, true));

        // Get user ID from session or token (implement your auth logic)
        $userId = $_POST['user_id'] ?? $_SESSION['user_id'] ?? null;
        $caption = $_POST['caption'] ?? '';

        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'User authentication required']);
            exit;
        }

        $uploader = new MediaUploader($pdo);
        $result = $uploader->uploadFiles($_FILES, $userId, $caption);

        ob_end_clean();
        echo json_encode([
            'success' => true,
            'message' => 'Files uploaded successfully',
            'data' => $result
        ]);

    }
    catch (Exception $e) {
        error_log("Upload error: " . $e->getMessage());
        ob_end_clean();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}
else {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
