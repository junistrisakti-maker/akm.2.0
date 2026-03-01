<?php
header('Content-Type: application/json');
require 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $userId = $data['userId'] ?? null;
    $caption = $data['caption'] ?? '';
    $imageUrl = $data['imageUrl'] ?? null;
    $location = $data['location'] ?? null;
    $type = $data['type'] ?? 'image';
    $audioName = $data['audioName'] ?? null;

    if (!$userId || (!$imageUrl && $type !== 'text')) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID and content are required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO posts (user_id, type, caption, url, location_name, audio_name) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $type, $caption, $imageUrl, $location, $audioName]);

        $postId = $pdo->lastInsertId();
        echo json_encode(['message' => 'Post created successfully', 'id' => $postId]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
