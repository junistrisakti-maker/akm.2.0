<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../auth/check-session.php';
require_once __DIR__ . '/../../api/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit();
}

try {
    // 1. Fetch settings
    $settings = $pdo->query("SELECT * FROM settings")->fetchAll(PDO::FETCH_KEY_PAIR);

    $cloud_name = $settings['cloudinary_cloud_name'] ?? '';
    $api_key = $settings['cloudinary_api_key'] ?? '';
    $api_secret = $settings['cloudinary_api_secret'] ?? '';
    $folder = $settings['cloudinary_folder'] ?? 'akm_backsound';

    if (empty($cloud_name) || empty($api_key) || empty($api_secret)) {
        throw new Exception('Kredensial Cloudinary belum diatur di menu Kelola API.');
    }

    // 2. Validate File
    if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Gagal mengunggah file ke server.');
    }

    $file = $_FILES['audio'];
    $allowed_types = ['audio/mpeg', 'audio/ogg', 'audio/mp3', 'video/webm']; // Cloudinary may detect audio as video/webm
    if (!in_array($file['type'], $allowed_types) && strpos($file['name'], '.mp3') === false) {
        throw new Exception('Format file tidak didukung. Gunakan MP3/OGG.');
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception('Ukuran file maksimal 5MB.');
    }

    // 3. Prepare Cloudinary Signed Upload
    $timestamp = time();
    $params = [
        'folder' => $folder,
        'timestamp' => $timestamp
    ];

    // Sort params for signature
    ksort($params);
    $param_string = "";
    foreach ($params as $key => $value) {
        $param_string .= "$key=$value&";
    }
    $param_string = rtrim($param_string, "&");
    $signature = sha1($param_string . $api_secret);

    // 4. Send to Cloudinary using cURL
    $url = "https://api.cloudinary.com/v1_1/$cloud_name/video/upload"; // Use 'video' for audio

    $post_data = [
        'file' => new CURLFile($file['tmp_name'], $file['type'], $file['name']),
        'api_key' => $api_key,
        'timestamp' => $timestamp,
        'signature' => $signature,
        'folder' => $folder,
        'resource_type' => 'video'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $result = json_decode($response, true);

    if ($http_code !== 200) {
        throw new Exception($result['error']['message'] ?? 'Gagal mengunggah ke Cloudinary.');
    }

    $secure_url = $result['secure_url'];
    // Tambahkan q_auto untuk optimalisasi kualitas otomatis oleh Cloudinary
    $optimized_url = str_replace('/upload/', '/upload/q_auto/', $secure_url);

    // 5. Update database
    $stmt = $pdo->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'active_backsound_url'");
    $stmt->execute([$optimized_url]);

    echo json_encode([
        'success' => true,
        'url' => $optimized_url,
        'message' => 'Audio berhasil diunggah dengan optimalisasi q_auto!'
    ]);

}
catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
