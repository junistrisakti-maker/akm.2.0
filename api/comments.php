<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    exit(0);
}

if ($method === 'GET') {
    $post_id = $_GET['post_id'] ?? 0;
    if (!$post_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID required']);
        exit();
    }

    try {
        $stmt = $pdo->prepare("SELECT c.*, u.username, u.avatar 
            FROM comments c 
            JOIN users u ON c.user_id = u.id 
            WHERE c.post_id = ? 
            ORDER BY c.created_at ASC");
        $stmt->execute([$post_id]);
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($comments);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $post_id = $data['post_id'] ?? 0;
    $user_id = $data['user_id'] ?? 0;
    $content = $data['content'] ?? '';

    if (!$post_id || !$user_id || empty($content)) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID, User ID, and content are required']);
        exit();
    }

    try {
        $pdo->beginTransaction();

        // 1. Insert comment
        $stmt = $pdo->prepare("INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)");
        $stmt->execute([$post_id, $user_id, $content]);

        // 2. Increment comment count in posts table
        $stmt = $pdo->prepare("UPDATE posts SET comments = comments + 1 WHERE id = ?");
        $stmt->execute([$post_id]);

        $pdo->commit();
        echo json_encode(['message' => 'Comment added successfully']);
    }
    catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
