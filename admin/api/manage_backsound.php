<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../api/config.php';
require_once __DIR__ . '/../auth/check-session.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM backsounds ORDER BY created_at DESC");
        $backsounds = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $backsounds]);
    }
    catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';
    $id = $data['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID is required']);
        exit;
    }

    try {
        if ($action === 'activate') {
            // 1. Get the URL of the backsound to activate
            $stmt = $pdo->prepare("SELECT url FROM backsounds WHERE id = ?");
            $stmt->execute([$id]);
            $url = $stmt->fetchColumn();

            if (!$url)
                throw new Exception("Backsound not found");

            $pdo->beginTransaction();
            // 2. Mark all as inactive
            $pdo->exec("UPDATE backsounds SET is_active = 0");
            // 3. Mark selected as active
            $stmt = $pdo->prepare("UPDATE backsounds SET is_active = 1 WHERE id = ?");
            $stmt->execute([$id]);
            // 4. Update global settings
            $stmt = $pdo->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'active_backsound_url'");
            $stmt->execute([$url]);
            $pdo->commit();

            echo json_encode(['success' => true, 'message' => 'Backsound activated']);
        }
        elseif ($action === 'delete') {
            // Fetch public_id to delete from Cloudinary if needed
            $stmt = $pdo->prepare("SELECT public_id, is_active FROM backsounds WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row)
                throw new Exception("Backsound not found");
            if ($row['is_active'])
                throw new Exception("Cannot delete active backsound");

            // Delete from database (Cloudinary deletion can be added if desired, but for now we focus on DB)
            $stmt = $pdo->prepare("DELETE FROM backsounds WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode(['success' => true, 'message' => 'Backsound deleted from database']);
        }
        else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
        }
    }
    catch (Exception $e) {
        if ($pdo->inTransaction())
            $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
