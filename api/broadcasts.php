<?php
header('Content-Type: application/json');
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $mosqueId = $_GET['mosque_id'] ?? null;
        if (!$mosqueId) {
            http_response_code(400);
            echo json_encode(['error' => 'Mosque ID is required']);
            exit();
        }

        $stmt = $pdo->prepare("SELECT * FROM youth_broadcasts WHERE mosque_id = ? ORDER BY created_at DESC");
        $stmt->execute([$mosqueId]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $mosqueId = $data['mosque_id'] ?? null;
        $content = $data['content'] ?? '';
        $adminId = $data['admin_id'] ?? null; // To verify permissions if needed

        if (!$mosqueId || !$content) {
            http_response_code(400);
            echo json_encode(['error' => 'Mosque ID and content are required']);
            exit();
        }

        $stmt = $pdo->prepare("INSERT INTO youth_broadcasts (mosque_id, title, content, created_at) VALUES (?, 'Youth Hub Broadcast', ?, NOW())");
        $stmt->execute([$mosqueId, $content]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    }
    elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Broadcast ID is required']);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM youth_broadcasts WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
}
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
