<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../api/config.php';
require_once __DIR__ . '/../auth/check-session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Metode tidak diizinkan.']);
    exit;
}

if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'File audio tidak ditemukan atau error saat unggah.']);
    exit;
}

$name = $_POST['name'] ?? 'Untitled Vibe';
$file = $_FILES['audio'];

// 1. Validate File
$maxSize = 20 * 1024 * 1024; // 20MB
if ($file['size'] > $maxSize) {
    echo json_encode(['success' => false, 'error' => 'File terlalu besar (Maks 20MB).']);
    exit;
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, ['mp3', 'wav', 'ogg', 'm4a'])) {
    echo json_encode(['success' => false, 'error' => 'Format file tidak didukung (MP3/WAV/OGG/M4A).']);
    exit;
}

// 2. Cloudinary Upload via cURL
if (empty(CLOUDINARY_CLOUD_NAME) || empty(CLOUDINARY_API_KEY) || empty(CLOUDINARY_API_SECRET)) {
    echo json_encode(['success' => false, 'error' => 'Konfigurasi Cloudinary belum lengkap di config.php.']);
    exit;
}

$timestamp = time();
$params = [
    'timestamp' => $timestamp,
    'folder' => 'akm/vibes'
];

// Sort and sign params
ksort($params);
$sign_str = "";
foreach ($params as $key => $val) {
    $sign_str .= "$key=$val&";
}
$sign_str = rtrim($sign_str, '&') . CLOUDINARY_API_SECRET;
$signature = sha1($sign_str);

$post_fields = array_merge($params, [
    'api_key' => CLOUDINARY_API_KEY,
    'signature' => $signature,
    'resource_type' => 'video',
    'file' => new CURLFile($file['tmp_name'], $file['type'], $file['name'])
]);

$ch = curl_init("https://api.cloudinary.com/v1_1/" . CLOUDINARY_CLOUD_NAME . "/video/upload");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For local dev skip SSL check if needed

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$res = json_decode($response, true);

if ($http_code === 200 && isset($res['secure_url'])) {
    // 3. Save to Database
    try {
        $stmt = $pdo->prepare("INSERT INTO backsounds (name, url, public_id, created_at, is_active) VALUES (?, ?, ?, NOW(), 0)");
        $stmt->execute([$name, $res['secure_url'], $res['public_id']]);

        echo json_encode([
            'success' => true,
            'message' => 'Vibe berhasil diunggah ke Cloudinary dan disimpan.',
            'url' => $res['secure_url']
        ]);
    }
    catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Gagal menyimpan ke database: ' . $e->getMessage()]);
    }
}
else {
    $err_msg = isset($res['error']['message']) ? $res['error']['message'] : 'Gagal unggah ke Cloudinary.';
    echo json_encode(['success' => false, 'error' => $err_msg, 'debug' => $response]);
}
?>
