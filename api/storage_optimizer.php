<?php
// Storage optimization library
class StorageOptimizer
{
    private $pdo;
    private $uploadDir = '../uploads/';
    private $compressionDir = '../uploads/compressed/';
    private $thumbnailDir = '../uploads/thumbnails/';

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->ensureDirectories();
    }

    private function ensureDirectories()
    {
        foreach ([$this->compressionDir, $this->thumbnailDir] as $dir) {
            if (!is_dir($dir)) {
                mkdir($dir, 0777, true);
            }
        }
    }

    public function optimizeImage($filePath, $quality = 85)
    {
        $imageInfo = getimagesize($filePath);
        if (!$imageInfo) {
            throw new Exception('Invalid image file');
        }

        $mimeType = $imageInfo['mime'];
        $originalSize = filesize($filePath);

        switch ($mimeType) {
            case 'image/jpeg':
                $image = imagecreatefromjpeg($filePath);
                $compressedPath = $this->getCompressedPath($filePath, 'jpg');
                imagejpeg($image, $compressedPath, $quality);
                imagedestroy($image);
                break;

            case 'image/png':
                $image = imagecreatefrompng($filePath);
                $compressedPath = $this->getCompressedPath($filePath, 'png');
                imagepng($image, $compressedPath, 8);
                imagedestroy($image);
                break;

            case 'image/webp':
                $image = imagecreatefromwebp($filePath);
                $compressedPath = $this->getCompressedPath($filePath, 'webp');
                imagewebp($image, $compressedPath, $quality);
                imagedestroy($image);
                break;

            default:
                throw new Exception('Unsupported image format');
        }

        $compressedSize = filesize($compressedPath);
        $savings = $originalSize - $compressedSize;
        $savingsPercent = ($savings / $originalSize) * 100;

        // Create thumbnails
        $this->createThumbnail($filePath, $mimeType);

        return [
            'original_size' => $originalSize,
            'compressed_size' => $compressedSize,
            'savings' => $savings,
            'savings_percent' => round($savingsPercent, 2),
            'compressed_path' => $compressedPath
        ];
    }

    private function getCompressedPath($originalPath, $extension)
    {
        $filename = pathinfo($originalPath, PATHINFO_FILENAME);
        return $this->compressionDir . $filename . '_compressed.' . $extension;
    }

    private function createThumbnail($filePath, $mimeType, $width = 300, $height = 300)
    {
        $imageInfo = getimagesize($filePath);
        $originalWidth = $imageInfo[0];
        $originalHeight = $imageInfo[1];

        // Calculate thumbnail dimensions maintaining aspect ratio
        $ratio = min($width / $originalWidth, $height / $originalHeight);
        $thumbWidth = intval($originalWidth * $ratio);
        $thumbHeight = intval($originalHeight * $ratio);

        // Create thumbnail
        $thumbnail = imagecreatetruecolor($thumbWidth, $thumbHeight);

        switch ($mimeType) {
            case 'image/jpeg':
                $source = imagecreatefromjpeg($filePath);
                break;
            case 'image/png':
                $source = imagecreatefrompng($filePath);
                imagealphablending($thumbnail, false);
                imagesavealpha($thumbnail, true);
                break;
            case 'image/webp':
                $source = imagecreatefromwebp($filePath);
                break;
            default:
                throw new Exception('Unsupported image format for thumbnail');
        }

        imagecopyresampled($thumbnail, $source, 0, 0, 0, 0, $thumbWidth, $thumbHeight, $originalWidth, $originalHeight);

        $filename = pathinfo($filePath, PATHINFO_FILENAME);
        $thumbnailPath = $this->thumbnailDir . $filename . '_thumb.jpg';

        imagejpeg($thumbnail, $thumbnailPath, 80);
        imagedestroy($thumbnail);
        imagedestroy($source);

        return $thumbnailPath;
    }

    public function optimizeVideo($filePath)
    {
        // This would use FFmpeg for video optimization
        // For now, return basic info
        $fileSize = filesize($filePath);

        return [
            'original_size' => $fileSize,
            'message' => 'Video optimization requires FFmpeg integration',
            'suggestions' => [
                'Convert to H.264 codec',
                'Reduce bitrate to 1-2 Mbps for mobile',
                'Create adaptive bitrate streams'
            ]
        ];
    }

    public function getStorageStats()
    {
        $stats = [
            'total_files' => 0,
            'total_size' => 0,
            'image_count' => 0,
            'video_count' => 0,
            'compression_savings' => 0
        ];

        // Scan upload directory
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->uploadDir)
            );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $stats['total_files']++;
                $stats['total_size'] += $file->getSize();

                $mimeType = mime_content_type($file->getPathname());
                if (strpos($mimeType, 'image/') === 0) {
                    $stats['image_count']++;
                }
                elseif (strpos($mimeType, 'video/') === 0) {
                    $stats['video_count']++;
                }
            }
        }

        // Calculate compression savings
        if (is_dir($this->compressionDir)) {
            $compressedSize = 0;
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($this->compressionDir)
                );

            foreach ($iterator as $file) {
                if ($file->isFile()) {
                    $compressedSize += $file->getSize();
                }
            }

            $stats['compression_savings'] = $stats['total_size'] - $compressedSize;
        }

        return $stats;
    }

    public function cleanupOldFiles($daysOld = 30)
    {
        $cutoffTime = time() - ($daysOld * 24 * 60 * 60);
        $deletedFiles = [];
        $freedSpace = 0;

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->uploadDir)
            );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getMTime() < $cutoffTime) {
                $fileSize = $file->getSize();
                if (unlink($file->getPathname())) {
                    $deletedFiles[] = $file->getPathname();
                    $freedSpace += $fileSize;
                }
            }
        }

        return [
            'deleted_files' => count($deletedFiles),
            'freed_space' => $freedSpace,
            'files' => $deletedFiles
        ];
    }

    public function generateCDNUrls($filePath)
    {
        // This would integrate with CDN services like Cloudflare, AWS CloudFront, etc.
        $filename = basename($filePath);

        return [
            'original' => $this->getPublicUrl($filePath),
            'compressed' => $this->getPublicUrl($this->compressionDir . pathinfo($filename, PATHINFO_FILENAME) . '_compressed.jpg'),
            'thumbnail' => $this->getPublicUrl($this->thumbnailDir . pathinfo($filename, PATHINFO_FILENAME) . '_thumb.jpg'),
            'cdn_urls' => [
                'cloudflare' => 'https://cdn.yourdomain.com/' . $filename,
                'aws' => 'https://d1234567890.cloudfront.net/' . $filename
            ]
        ];
    }

    private function getPublicUrl($filePath)
    {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $relativePath = str_replace('../', '/', $filePath);
        return $protocol . "://" . $host . "/AKM.2.0" . $relativePath;
    }
}

// Direct API call handler
if (basename($_SERVER['PHP_SELF']) == 'storage_optimizer.php') {
    header('Content-Type: application/json');
    require_once 'config.php';

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        try {
            $data = json_decode(file_get_contents("php://input"), true);
            $action = $data['action'] ?? null;
            $optimizer = new StorageOptimizer($pdo);

            switch ($action) {
                case 'optimize_image':
                    $filePath = $data['file_path'] ?? null;
                    $quality = $data['quality'] ?? 85;
                    if (!$filePath || !file_exists($filePath))
                        throw new Exception('Invalid file path');
                    $result = $optimizer->optimizeImage($filePath, $quality);
                    echo json_encode(['success' => true, 'result' => $result]);
                    break;
                case 'optimize_video':
                    $filePath = $data['file_path'] ?? null;
                    if (!$filePath || !file_exists($filePath))
                        throw new Exception('Invalid file path');
                    $result = $optimizer->optimizeVideo($filePath);
                    echo json_encode(['success' => true, 'result' => $result]);
                    break;
                case 'cleanup':
                    $daysOld = $data['days_old'] ?? 30;
                    $result = $optimizer->cleanupOldFiles($daysOld);
                    echo json_encode(['success' => true, 'result' => $result]);
                    break;
                case 'get_stats':
                    $stats = $optimizer->getStorageStats();
                    echo json_encode(['success' => true, 'stats' => $stats]);
                    break;
                default:
                    throw new Exception('Invalid action');
            }
        }
        catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        try {
            $optimizer = new StorageOptimizer($pdo);
            $stats = $optimizer->getStorageStats();
            echo json_encode(['success' => true, 'stats' => $stats]);
        }
        catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
?>
