<?php
header('Content-Type: application/json');
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $id = $_GET['id'] ?? null;
        if (!empty($id) && $id !== 'null' && $id !== 'undefined') {
            $stmt = $pdo->prepare("SELECT * FROM mosques WHERE id = ?");
            $stmt->execute([$id]);
            $mosque = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'mosque' => $mosque]);
        }
        else {
            $stmt = $pdo->query("SELECT id, name, org_name FROM mosques ORDER BY name ASC");
            $mosques = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'mosques' => $mosques]);
        }
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;

        if (empty($id) || $id === 'null' || $id === 'undefined') {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Valid Mosque ID required']);
            exit;
        }

        $fields = [
            'name', 'org_name', 'address', 'description', 'hub_vibe',
            'instagram_handle', 'tiktok_handle', 'latitude', 'longitude'
        ];

        $updates = [];
        $params = [];
        foreach ($fields as $f) {
            if (isset($data[$f])) {
                $updates[] = "`$f` = ?";
                $params[] = $data[$f];
            }
        }

        if (count($updates) === 0) {
            echo json_encode(['success' => true, 'message' => 'No changes made']);
            exit;
        }

        $params[] = $id;
        $sql = "UPDATE mosques SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['success' => true, 'message' => 'Youth Hub profile updated successfully']);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
