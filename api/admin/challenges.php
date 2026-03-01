<?php
header('Content-Type: application/json');
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM challenges ORDER BY created_at DESC");
        $challenges = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'challenges' => $challenges]);
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

        if ($action === 'create') {
            $stmt = $pdo->prepare("INSERT INTO challenges (title, description, points_reward, target_count, period_type, start_date, end_date, mosque_id, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['title'],
                $data['description'],
                $data['points_reward'],
                $data['target_count'],
                $data['period_type'],
                $data['period_type'] === 'seasonal' ? $data['start_date'] : null,
                $data['period_type'] === 'seasonal' ? $data['end_date'] : null,
                $mosqueId,
                $data['type'] ?? 'post'
            ]);
        }
        elseif ($action === 'delete') {
            $stmt = $pdo->prepare("DELETE FROM challenges WHERE id = ?");
            $stmt->execute([$data['id']]);
        }

        echo json_encode(['success' => true]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
// Note: If challenges table doesn't exist, it should be created via a migration or setup script.
// Assuming it exists for now based on existing context.
