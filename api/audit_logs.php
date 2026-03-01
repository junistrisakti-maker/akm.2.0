<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// RBAC check: Only Superadmin can access this API
function checkSuperadmin($pdo, $user_id)
{
    if (!$user_id)
        return false;
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return ($user && $user['role'] === 'superadmin');
}

if ($method === 'OPTIONS') {
    exit(0);
}

if ($method === 'GET') {
    $admin_id = $_GET['admin_id'] ?? 0;
    if (!checkSuperadmin($pdo, $admin_id)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: Superadmin access required']);
        exit();
    }

    try {
        $stmt = $pdo->query("SELECT a.*, u.username as admin_name 
            FROM audit_logs a 
            JOIN users u ON a.user_id = u.id 
            ORDER BY a.created_at DESC LIMIT 100");
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['logs' => $logs]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
elseif ($method === 'POST') {
    // Internal logging (no RBAC check on POST, but endpoint should be internal/restricted)
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = $data['user_id'] ?? 0;
    $action = $data['action'] ?? '';
    $details = $data['details'] ?? '';
    $ip = $_SERVER['REMOTE_ADDR'];

    if (!$user_id || !$action) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID and Action required']);
        exit();
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)");
        $stmt->execute([$user_id, $action, $details, $ip]);
        echo json_encode(['message' => 'Log added']);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
