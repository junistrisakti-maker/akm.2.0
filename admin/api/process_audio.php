<?php
/**
 * Audio Processor Engine (Senior Edition)
 * Handles visual trimming, FFmpeg compression, and Cloudinary Signed Upload
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../../api/config.php';
require_once __DIR__ . '/../auth/check-session.php';

// Disable error reporting to output for clean JSON
error_reporting(0);
ini_set('display_errors', 0);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Metode tidak diizinkan.']);
    exit;
}

// 1. Requirements Check
$ffmpegPath = realpath(__DIR__ . '/../../ffmpeg.exe');
if (!file_exists($ffmpegPath)) {
    echo json_encode(['success' => false, 'error' => 'FFmpeg engine tidak ditemukan di root server.']);
    exit;
}

$tempDir = __DIR__ . '/../../uploads/temp/';
if (!file_exists($tempDir))
    mkdir($tempDir, 0777, true);

// 2. Input Validation
if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'File audio gagal diunggah ke server.']);
    exit;
}

$name = $_POST['name'] ?? 'Untitled Vibe';
$startTime = floatval($_POST['start'] ?? 0);
$duration = floatval($_POST['duration'] ?? 15); // Default 15s if not specified
$file = $_FILES['audio'];

// 3. File Processing (FFmpeg)
$inputPath = $file['tmp_name'];
$outputFile = 'trim_' . time() . '_' . uniqid() . '.mp3';
$outputPath = $tempDir . $outputFile;

// FFmpeg Command: Cut (-ss -t) and Compress (-b:a 128k)
// -y overwrite, -i input, -ss start, -t duration, -acodec copy (if only cutting), but we want compression
$cmd = "\"$ffmpegPath\" -y -i \"$inputPath\" -ss $startTime -t $duration -b:a 128k \"$outputPath\" 2>&1";
exec($cmd, $output, $returnCode);

if ($returnCode !== 0) {
    echo json_encode(['success' => false, 'error' => 'FFmpeg gagal memproses audio.', 'debug' => $output]);
    exit;
}

// 4. Cloudinary Signed Upload
if (empty(CLOUDINARY_CLOUD_NAME) || empty(CLOUDINARY_API_KEY) || empty(CLOUDINARY_API_SECRET)) {
    unlink($outputPath); // Clean up
    echo json_encode(['success' => false, 'error' => 'Konfigurasi Cloudinary di System Settings belum lengkap.']);
    exit;
}

$timestamp = time();
$publicId = 'vibe_' . time();
$folder = 'akm/vibes';

// Prepare params for signing
$params = [
    'folder' => $folder,
    'public_id' => $publicId,
    'timestamp' => $timestamp
];

ksort($params);
$signStr = "";
foreach ($params as $k => $v)
    $signStr .= "$k=$v&";
$signStr = rtrim($signStr, '&') . CLOUDINARY_API_SECRET;
$signature = sha1($signStr);

// Upload via cURL
$ch = curl_init("https://api.cloudinary.com/v1_1/" . CLOUDINARY_CLOUD_NAME . "/video/upload");
$postFields = array_merge($params, [
    'api_key' => CLOUDINARY_API_KEY,
    'signature' => $signature,
    'file' => new CURLFile($outputPath)
]);

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$res = json_decode($response, true);

// 5. Database & Cleanup
if ($httpCode === 200 && isset($res['secure_url'])) {
    try {
        // Use f_auto in the URL for efficiency as requested
        $optimizedUrl = str_replace('/upload/', '/upload/f_auto/', $res['secure_url']);

        $stmt = $pdo->prepare("INSERT INTO backsounds (name, url, public_id, created_at, is_active) VALUES (?, ?, ?, NOW(), 0)");
        $stmt->execute([$name, $optimizedUrl, $res['public_id']]);

        // Cleanup temp file
        unlink($outputPath);

        echo json_encode([
            'success' => true,
            'message' => 'Audio berhasil dipotong, dikompres, dan disimpan.',
            'url' => $optimizedUrl
        ]);
    }
    catch (PDOException $e) {
        unlink($outputPath);
        echo json_encode(['success' => false, 'error' => 'Gagal simpan ke DB: ' . $e->getMessage()]);
    }
}
else {
    unlink($outputPath);
    echo json_encode(['success' => false, 'error' => 'Cloudinary upload failed.', 'debug' => $res]);
}
?>
