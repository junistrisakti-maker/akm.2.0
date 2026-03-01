<?php
header('Content-Type: application/json');
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $mosqueId = $_GET['mosqueId'] ?? null;
        if (empty($mosqueId) || $mosqueId === 'null' || $mosqueId === 'undefined') {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Valid Mosque ID required']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM youth_broadcasts WHERE mosque_id = ? ORDER BY created_at DESC");
        $stmt->execute([$mosqueId]);
        $broadcasts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'broadcasts' => $broadcasts]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? 'create';
        $mosqueId = $data['mosqueId'] ?? null;
        if (empty($mosqueId) || $mosqueId === 'null' || $mosqueId === 'undefined') {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Valid Mosque ID required']);
            exit;
        }

        if ($action === 'create') {
            $stmt = $pdo->prepare("INSERT INTO youth_broadcasts (mosque_id, title, content, media_url) VALUES (?, ?, ?, ?)");
            $stmt->execute([$mosqueId, $data['title'], $data['content'], $data['media_url'] ?? null]);
            echo json_encode(['success' => true, 'message' => 'Broadcast committed to matrix']);
        }
        elseif ($action === 'delete') {
            $stmt = $pdo->prepare("DELETE FROM youth_broadcasts WHERE id = ? AND mosque_id = ?");
            $stmt->execute([$data['id'], $mosqueId]);
            echo json_encode(['success' => true, 'message' => 'Broadcast purged from matrix']);
        }
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
