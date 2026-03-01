<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
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

$user_id = $_GET['admin_id'] ?? $_POST['admin_id'] ?? 0;
// For PUT we need to get admin_id from the body
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = $data['admin_id'] ?? 0;
}

if (!checkSuperadmin($pdo, $user_id)) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Superadmin access required']);
    exit();
}

if ($method === 'GET') {
    try {
        $search = $_GET['search'] ?? '';
        $query = "SELECT id, username, email, name, role, status, points, streak, created_at FROM users";
        $params = [];

        if (!empty($search)) {
            $query .= " WHERE username LIKE ? OR email LIKE ? OR name LIKE ?";
            $params = ["%$search%", "%$search%", "%$search%"];
        }

        $query .= " ORDER BY created_at DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['users' => $users]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $target_user_id = $data['user_id'] ?? 0;
    $new_role = $data['role'] ?? '';
    $new_status = $data['status'] ?? '';

    if (!$target_user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Target user ID required']);
        exit();
    }

    try {
        $updates = [];
        $params = [];

        if (!empty($new_role)) {
            $updates[] = "role = ?";
            $params[] = $new_role;
        }
        if (!empty($new_status)) {
            $updates[] = "status = ?";
            $params[] = $new_status;
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit();
        }

        $params[] = $target_user_id;
        $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Audit Log entry should be here (future step)

        echo json_encode(['message' => 'User updated successfully']);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
