<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../api/config.php';
require_once __DIR__ . '/../auth/check-session.php';

$id = $_GET['id'] ?? null;
if (!$id) {
    echo json_encode(['success' => false, 'error' => 'ID tidak ditemukan.']);
    exit;
}

try {
    // 1. Get public_id for Cloudinary deletion
    $stmt = $pdo->prepare("SELECT public_id FROM backsounds WHERE id = ?");
    $stmt->execute([$id]);
    $vibe = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($vibe && $vibe['public_id']) {
        // 2. Cloudinary Deletion via cURL
        $timestamp = time();
        $public_id = $vibe['public_id'];

        $params = [
            'public_id' => $public_id,
            'timestamp' => $timestamp
        ];
        ksort($params);
        $sign_str = "public_id=$public_id&timestamp=$timestamp" . CLOUDINARY_API_SECRET;
        $signature = sha1($sign_str);

        $ch = curl_init("https://api.cloudinary.com/v1_1/" . CLOUDINARY_CLOUD_NAME . "/video/destroy");
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, [
            'public_id' => $public_id,
            'api_key' => CLOUDINARY_API_KEY,
            'timestamp' => $timestamp,
            'signature' => $signature
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_exec($ch);
        curl_close($ch);
    }

    // 3. Delete from DB
    $pdo->prepare("DELETE FROM backsounds WHERE id = ?")->execute([$id]);

    echo json_encode(['success' => true]);
}
catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
