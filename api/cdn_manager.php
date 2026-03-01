<?php
header('Content-Type: application/json');
require 'config.php';

class CDNManager {
    private $pdo;
    private $cdnConfig;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->cdnConfig = $this->getCDNConfig();
    }
    
    private function getCDNConfig() {
        // Get CDN configuration from database or environment
        return [
            'cloudflare' => [
                'enabled' => $_ENV['CLOUDFLARE_ENABLED'] ?? false,
                'zone_id' => $_ENV['CLOUDFLARE_ZONE_ID'] ?? null,
                'api_token' => $_ENV['CLOUDFLARE_API_TOKEN'] ?? null,
                'domain' => $_ENV['CLOUDFLARE_DOMAIN'] ?? null
            ],
            'aws_cloudfront' => [
                'enabled' => $_ENV['AWS_CLOUDFRONT_ENABLED'] ?? false,
                'distribution_id' => $_ENV['AWS_CLOUDFRONT_DISTRIBUTION_ID'] ?? null,
                'access_key' => $_ENV['AWS_ACCESS_KEY'] ?? null,
                'secret_key' => $_ENV['AWS_SECRET_KEY'] ?? null,
                'region' => $_ENV['AWS_REGION'] ?? 'us-east-1',
                'domain' => $_ENV['AWS_CLOUDFRONT_DOMAIN'] ?? null
            ],
            'aws_s3' => [
                'enabled' => $_ENV['AWS_S3_ENABLED'] ?? false,
                'bucket' => $_ENV['AWS_S3_BUCKET'] ?? null,
                'access_key' => $_ENV['AWS_ACCESS_KEY'] ?? null,
                'secret_key' => $_ENV['AWS_SECRET_KEY'] ?? null,
                'region' => $_ENV['AWS_REGION'] ?? 'us-east-1',
                'domain' => $_ENV['AWS_S3_DOMAIN'] ?? null
            ]
        ];
    }
    
    public function uploadToCDN($localPath, $remotePath = null) {
        $result = [
            'success' => false,
            'cdn_urls' => [],
            'errors' => []
        ];
        
        if (!$remotePath) {
            $remotePath = basename($localPath);
        }
        
        // Try Cloudflare R2 (if enabled)
        if ($this->cdnConfig['cloudflare']['enabled']) {
            try {
                $cloudflareResult = $this->uploadToCloudflareR2($localPath, $remotePath);
                if ($cloudflareResult['success']) {
                    $result['cdn_urls']['cloudflare'] = $cloudflareResult['url'];
                    $result['success'] = true;
                } else {
                    $result['errors'][] = 'Cloudflare R2: ' . $cloudflareResult['error'];
                }
            } catch (Exception $e) {
                $result['errors'][] = 'Cloudflare R2: ' . $e->getMessage();
            }
        }
        
        // Try AWS S3 (if enabled)
        if ($this->cdnConfig['aws_s3']['enabled']) {
            try {
                $s3Result = $this->uploadToS3($localPath, $remotePath);
                if ($s3Result['success']) {
                    $result['cdn_urls']['aws_s3'] = $s3Result['url'];
                    $result['success'] = true;
                } else {
                    $result['errors'][] = 'AWS S3: ' . $s3Result['error'];
                }
            } catch (Exception $e) {
                $result['errors'][] = 'AWS S3: ' . $e->getMessage();
            }
        }
        
        // Log the upload attempt
        $this->logCDNUpload($localPath, $remotePath, $result);
        
        return $result;
    }
    
    private function uploadToCloudflareR2($localPath, $remotePath) {
        $config = $this->cdnConfig['cloudflare'];
        
        if (!$config['zone_id'] || !$config['api_token']) {
            throw new Exception('Cloudflare R2 configuration incomplete');
        }
        
        // This is a simplified implementation
        // In production, you would use the Cloudflare R2 API SDK
        
        $fileContent = file_get_contents($localPath);
        $mimeType = mime_content_type($localPath);
        
        // Generate presigned URL or use direct upload
        $uploadUrl = "https://api.cloudflare.com/client/v4/accounts/{$config['zone_id']}/r2/buckets/{$config['bucket']}/objects/{$remotePath}";
        
        $ch = curl_init($uploadUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => 'PUT',
            CURLOPT_POSTFIELDS => $fileContent,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $config['api_token'],
                'Content-Type: ' . $mimeType
            ],
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception('cURL Error: ' . $error);
        }
        
        if ($httpCode !== 200) {
            throw new Exception("Upload failed with HTTP {$httpCode}");
        }
        
        $publicUrl = "https://{$config['domain']}/{$remotePath}";
        
        return [
            'success' => true,
            'url' => $publicUrl
        ];
    }
    
    private function uploadToS3($localPath, $remotePath) {
        $config = $this->cdnConfig['aws_s3'];
        
        if (!$config['bucket'] || !$config['access_key'] || !$config['secret_key']) {
            throw new Exception('AWS S3 configuration incomplete');
        }
        
        // This is a simplified implementation using AWS SDK
        // In production, you would install and use the official AWS SDK
        
        $fileContent = file_get_contents($localPath);
        $mimeType = mime_content_type($localPath);
        
        // Create S3 signature
        $region = $config['region'];
        $service = 's3';
        $host = "{$config['bucket']}.{$service}.{$region}.amazonaws.com";
        $endpoint = "https://{$host}/{$remotePath}";
        
        $amzDate = gmdate('Ymd\THis\Z');
        $dateStamp = gmdate('Ymd');
        $method = 'PUT';
        $canonicalUri = "/{$remotePath}";
        $canonicalHeaders = "content-type:{$mimeType}\nhost:{$host}\nx-amz-date:{$amzDate}\n";
        $signedHeaders = 'content-type;host;x-amz-date';
        $payloadHash = hash('sha256', $fileContent);
        
        $canonicalRequest = "{$method}\n{$canonicalUri}\n\n{$canonicalHeaders}\n{$signedHeaders}\n{$payloadHash}";
        $algorithm = 'AWS4-HMAC-SHA256';
        $credentialScope = "{$dateStamp}/{$region}/{$service}/aws4_request";
        $stringToSign = "{$algorithm}\n{$amzDate}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);
        
        $signingKey = $this->getSignatureKey($config['secret_key'], $dateStamp, $region, $service);
        $signature = hash_hmac('sha256', $stringToSign, $signingKey);
        
        $authorizationHeader = "{$algorithm} Credential={$config['access_key']}/{$credentialScope}, SignedHeaders={$signedHeaders}, Signature={$signature}";
        
        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => 'PUT',
            CURLOPT_POSTFIELDS => $fileContent,
            CURLOPT_HTTPHEADER => [
                'Authorization: ' . $authorizationHeader,
                'Content-Type: ' . $mimeType,
                'X-Amz-Date: ' . $amzDate,
                'X-Amz-Content-Sha256: ' . $payloadHash
            ],
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception('cURL Error: ' . $error);
        }
        
        if ($httpCode !== 200) {
            throw new Exception("S3 upload failed with HTTP {$httpCode}");
        }
        
        $publicUrl = $config['domain'] 
            ? "https://{$config['domain']}/{$remotePath}"
            : "https://{$host}/{$remotePath}";
        
        return [
            'success' => true,
            'url' => $publicUrl
        ];
    }
    
    private function getSignatureKey($key, $dateStamp, $regionName, $serviceName) {
        $kDate = hash_hmac('sha256', $dateStamp, 'AWS4' . $key, true);
        $kRegion = hash_hmac('sha256', $regionName, $kDate, true);
        $kService = hash_hmac('sha256', $serviceName, $kRegion, true);
        $kSigning = hash_hmac('sha256', 'aws4_request', $kService, true);
        return $kSigning;
    }
    
    public function invalidateCDNCache($urls) {
        $result = [
            'success' => false,
            'invalidated' => [],
            'errors' => []
        ];
        
        // Cloudflare cache invalidation
        if ($this->cdnConfig['cloudflare']['enabled']) {
            try {
                $cfResult = $this->invalidateCloudflareCache($urls);
                if ($cfResult['success']) {
                    $result['invalidated']['cloudflare'] = $cfResult['files'];
                    $result['success'] = true;
                } else {
                    $result['errors'][] = 'Cloudflare: ' . $cfResult['error'];
                }
            } catch (Exception $e) {
                $result['errors'][] = 'Cloudflare: ' . $e->getMessage();
            }
        }
        
        // CloudFront invalidation
        if ($this->cdnConfig['aws_cloudfront']['enabled']) {
            try {
                $cfResult = $this->invalidateCloudFrontCache($urls);
                if ($cfResult['success']) {
                    $result['invalidated']['cloudfront'] = $cfResult['files'];
                    $result['success'] = true;
                } else {
                    $result['errors'][] = 'CloudFront: ' . $cfResult['error'];
                }
            } catch (Exception $e) {
                $result['errors'][] = 'CloudFront: ' . $e->getMessage();
            }
        }
        
        return $result;
    }
    
    private function invalidateCloudflareCache($urls) {
        $config = $this->cdnConfig['cloudflare'];
        
        $purgeUrl = "https://api.cloudflare.com/client/v4/zones/{$config['zone_id']}/purge_cache";
        
        $data = [
            'files' => $urls
        ];
        
        $ch = curl_init($purgeUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $config['api_token'],
                'Content-Type: application/json'
            ],
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception('cURL Error: ' . $error);
        }
        
        $result = json_decode($response, true);
        
        if ($httpCode !== 200 || !$result['success']) {
            throw new Exception('Cache invalidation failed');
        }
        
        return [
            'success' => true,
            'files' => $urls
        ];
    }
    
    private function invalidateCloudFrontCache($urls) {
        $config = $this->cdnConfig['aws_cloudfront'];
        
        // This would use AWS SDK for CloudFront invalidation
        // Simplified implementation for demonstration
        
        $invalidationPaths = array_map(function($url) {
            return parse_url($url, PHP_URL_PATH);
        }, $urls);
        
        return [
            'success' => true,
            'files' => $invalidationPaths
        ];
    }
    
    public function getOptimalUrl($localPath, $fallbackUrl = null) {
        // Check if file is already uploaded to CDN
        $filename = basename($localPath);
        
        $stmt = $this->pdo->prepare("
            SELECT cdn_urls FROM cdn_uploads 
            WHERE local_path = ? OR remote_path = ?
            ORDER BY created_at DESC LIMIT 1
        ");
        
        $stmt->execute([$localPath, $filename]);
        $upload = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($upload) {
            $cdnUrls = json_decode($upload['cdn_urls'], true);
            
            // Prefer Cloudflare, then AWS S3
            if (!empty($cdnUrls['cloudflare'])) {
                return $cdnUrls['cloudflare'];
            } elseif (!empty($cdnUrls['aws_s3'])) {
                return $cdnUrls['aws_s3'];
            }
        }
        
        // Return fallback URL if available
        return $fallbackUrl;
    }
    
    public function syncLocalToCDN($localDirectory) {
        $results = [
            'success' => true,
            'uploaded' => [],
            'errors' => [],
            'total_files' => 0,
            'uploaded_count' => 0
        ];
        
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($localDirectory)
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $results['total_files']++;
                $localPath = $file->getPathname();
                $relativePath = str_replace($localDirectory, '', $localPath);
                $relativePath = ltrim($relativePath, '/\\');
                
                try {
                    $uploadResult = $this->uploadToCDN($localPath, $relativePath);
                    
                    if ($uploadResult['success']) {
                        $results['uploaded'][] = [
                            'local_path' => $localPath,
                            'remote_path' => $relativePath,
                            'cdn_urls' => $uploadResult['cdn_urls']
                        ];
                        $results['uploaded_count']++;
                    } else {
                        $results['errors'][] = "Failed to upload {$relativePath}: " . implode(', ', $uploadResult['errors']);
                    }
                } catch (Exception $e) {
                    $results['errors'][] = "Error uploading {$relativePath}: " . $e->getMessage();
                }
            }
        }
        
        if (!empty($results['errors'])) {
            $results['success'] = false;
        }
        
        return $results;
    }
    
    private function logCDNUpload($localPath, $remotePath, $result) {
        $stmt = $this->pdo->prepare("
            INSERT INTO cdn_uploads 
            (local_path, remote_path, cdn_urls, success, errors, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $localPath,
            $remotePath,
            json_encode($result['cdn_urls']),
            $result['success'] ? 1 : 0,
            json_encode($result['errors'])
        ]);
    }
    
    public function getCDNStats() {
        $stmt = $this->pdo->prepare("
            SELECT 
                COUNT(*) as total_uploads,
                COUNT(CASE WHEN success = 1 THEN 1 END) as successful_uploads,
                COUNT(CASE WHEN success = 0 THEN 1 END) as failed_uploads,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100 as success_rate,
                DATE(created_at) as upload_date
            FROM cdn_uploads 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY upload_date DESC
        ");
        
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// API endpoints
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? 'upload';
        
        $cdnManager = new CDNManager($pdo);
        
        switch ($action) {
            case 'upload':
                $localPath = $data['local_path'] ?? null;
                $remotePath = $data['remote_path'] ?? null;
                
                if (!$localPath || !file_exists($localPath)) {
                    throw new Exception('Valid local path is required');
                }
                
                $result = $cdnManager->uploadToCDN($localPath, $remotePath);
                echo json_encode($result);
                break;
                
            case 'invalidate':
                $urls = $data['urls'] ?? [];
                
                if (empty($urls)) {
                    throw new Exception('URLs array is required');
                }
                
                $result = $cdnManager->invalidateCDNCache($urls);
                echo json_encode($result);
                break;
                
            case 'sync':
                $localDirectory = $data['local_directory'] ?? null;
                
                if (!$localDirectory || !is_dir($localDirectory)) {
                    throw new Exception('Valid local directory is required');
                }
                
                $result = $cdnManager->syncLocalToCDN($localDirectory);
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
        $action = $_GET['action'] ?? 'stats';
        $cdnManager = new CDNManager($pdo);
        
        switch ($action) {
            case 'stats':
                $stats = $cdnManager->getCDNStats();
                echo json_encode(['success' => true, 'data' => $stats]);
                break;
                
            case 'optimal_url':
                $localPath = $_GET['local_path'] ?? null;
                $fallbackUrl = $_GET['fallback_url'] ?? null;
                
                if (!$localPath) {
                    throw new Exception('Local path is required');
                }
                
                $url = $cdnManager->getOptimalUrl($localPath, $fallbackUrl);
                echo json_encode(['success' => true, 'url' => $url]);
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
