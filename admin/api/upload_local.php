<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../auth/check-session.php';

$uploadDir = __DIR__ . '/../uploads/temp/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['audio'])) {
        echo json_encode(['success' => false, 'error' => 'Tidak ada file yang diunggah.']);
        exit;
    }

    $file = $_FILES['audio'];
    $maxSize = 10 * 1024 * 1024; // 10MB

    if ($file['size'] > $maxSize) {
        echo json_encode(['success' => false, 'error' => 'Ukuran file terlalu besar (Maks 10MB).']);
        exit;
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['mp3', 'ogg', 'wav', 'm4a'])) {
        echo json_encode(['success' => false, 'error' => 'Format file tidak didukung (Gunakan MP3/OGG/WAV).']);
        exit;
    }

    $filename = time() . '_' . preg_replace("/[^a-zA-Z0-9.]/", "_", $file['name']);
    $targetPath = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        echo json_encode([
            'success' => true,
            'filename' => $filename,
            'message' => 'File berhasil diunggah secara lokal.'
        ]);
    }
    else {
        echo json_encode(['success' => false, 'error' => 'Gagal memindahkan file ke folder temporary.']);
    }
}
else {
    echo json_encode(['success' => false, 'error' => 'Metode tidak diizinkan.']);
}
?>
