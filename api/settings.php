<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM system_settings ORDER BY setting_group, setting_key");
        $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Group by group
        $grouped = [];
        foreach ($settings as $s) {
            $grouped[$s['setting_group']][] = $s;
        }

        echo json_encode(['settings' => $grouped]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch settings: ' . $e->getMessage()]);
    }
}
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // RBAC: Only superadmin can update settings
    $user_id = $data['user_id'] ?? 0;
    if (!$user_id) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized: User ID required']);
        exit();
    }

    // Verify user role
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || $user['role'] !== 'superadmin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: Only superadmin can modify system settings']);
        exit();
    }

    $settings = $data['settings'] ?? []; // Map of key => value

    if (empty($settings)) {
        http_response_code(400);
        echo json_encode(['error' => 'No settings provided']);
        exit();
    }

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("UPDATE system_settings SET setting_value = ? WHERE setting_key = ?");

        foreach ($settings as $key => $value) {
            $stmt->execute([$value, $key]);
        }

        $pdo->commit();
        echo json_encode(['message' => 'Settings updated successfully']);
    }
    catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Update failed: ' . $e->getMessage()]);
    }
}
?>
