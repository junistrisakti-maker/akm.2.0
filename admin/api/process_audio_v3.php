<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../auth/check-session.php';
require_once __DIR__ . '/../../api/config.php';
ini_set('display_errors', 0); 
error_reporting(E_ALL);
$logFile = __DIR__ . '/process_audio_v2.log';
function debug_log($msg) {
    global $logFile;
    file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] " . $msg . "\n", FILE_APPEND);
}
debug_log("Starting audio process v3...");
$inputRaw = file_get_contents('php://input');
debug_log("Raw Input: " . $inputRaw);
$input = json_decode($inputRaw, true);
if (!$input || !isset($input['filename']) || !isset($input['start']) || !isset($input['duration'])) {
    debug_log("Error: Data tidak lengkap.");
    echo json_encode(['status' => 'error', 'message' => 'Data tidak lengkap.']);
    exit;
}
$tempDir = __DIR__ . '/../uploads/temp/';
$sourceFile = $tempDir . $input['filename'];
$startTime = (float)$input['start'];
$duration = (float)$input['duration'];
debug_log("Source: $sourceFile, Start: $startTime, Duration: $duration");
if (!file_exists($sourceFile)) {
    debug_log("Error: File sumber tidak ditemukan: " . $input['filename']);
    echo json_encode(['status' => 'error', 'message' => 'File sumber tidak ditemukan.']);
    exit;
}
try {
    $settings = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'cloudinary_%'")->fetchAll(PDO::FETCH_KEY_PAIR);
} catch (Exception $e) {
    debug_log("DB Error: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil settings.']);
    exit;
}
$cloudName = $settings['cloudinary_cloud_name'] ?? '';
$apiKey = $settings['cloudinary_api_key'] ?? '';
$apiSecret = $settings['cloudinary_api_secret'] ?? '';
$folder = $settings['cloudinary_folder'] ?? 'backsounds';
if (!$cloudName || !$apiKey || !$apiSecret) {
    debug_log("Error: Konfigurasi Cloudinary tidak lengkap.");
    echo json_encode(['status' => 'error', 'message' => 'Konfigurasi Cloudinary belum lengkap.']);
    exit;
}
$outputFile = $tempDir . "trimmed_" . time() . ".mp3";
$ffmpegPath = 'C:\laragon\www\AKM.2.0\ffmpeg.exe'; 
if (!file_exists($ffmpegPath)) {
    debug_log("Error: FFmpeg not found at $ffmpegPath");
    echo json_encode(['status' => 'error', 'message' => 'FFmpeg executable tidak ditemukan.']);
    exit;
}
function formatFF($sec) {
    $hours = floor($sec / 3600);
    $minutes = floor(($sec / 60) % 60);
    $seconds = floor($sec % 60);
    $ms = round(($sec - floor($sec)) * 1000);
    return sprintf('%02d:%02d:%02d.%03d', $hours, $minutes, $seconds, $ms);
}
$startFF = formatFF($startTime);
$durFF = formatFF($duration);
$cmd = "\"$ffmpegPath\" -ss $startFF -i \"$sourceFile\" -t $durFF -q:a 4 \"$outputFile\" 2>&1";
debug_log("Executing command: $cmd");
$out = [];
$ret = -1;
exec($cmd, $out, $ret);
if ($ret !== 0) {
    debug_log("FFmpeg Error (Code $ret): " . implode("\n", $out));
    echo json_encode(['status' => 'error', 'message' => 'Gagal memotong audio.', 'debug' => $out]);
    exit;
}
debug_log("FFmpeg Success. Output: $outputFile");
$timestamp = time();
$signatureData = "folder=$folder&timestamp=$timestamp" . $apiSecret;
$signature = sha1($signatureData);
$url = "https://api.cloudinary.com/v1_1/$cloudName/video/upload";
debug_log("Uploading to Cloudinary...");
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, [
    "file" => new CURLFile($outputFile),
    "api_key" => $apiKey,
    "timestamp" => $timestamp,
    "signature" => $signature,
    "folder" => $folder
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$rawResponse = curl_exec($ch);
$curlError = curl_error($ch);
$response = json_decode($rawResponse, true);
curl_close($ch);
if ($curlError) debug_log("CURL Error: $curlError");
if (isset($response['secure_url'])) {
    debug_log("Upload Success: " . $response['secure_url']);
    $secure_url = $response['secure_url'];
    $stmt = $pdo->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'active_backsound_url'");
    $stmt->execute([$secure_url]);
    @unlink($sourceFile);
    @unlink($outputFile);
    debug_log("Cleanup done. Process complete.");
    echo json_encode(['status' => 'success', 'url' => $secure_url, 'message' => 'Audio berhasil dipotong, dikompres, dan diaktifkan!']);
} else {
    debug_log("Upload Failed. Response: " . $rawResponse);
    echo json_encode(['status' => 'error', 'message' => 'Gagal mengunggah ke Cloudinary.', 'detail' => $response]);
}
?>
