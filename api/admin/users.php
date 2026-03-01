<?php
header('Content-Type: application/json');
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $search = $_GET['search'] ?? '';
        $adminId = $_GET['adminId'] ?? 0;

        // Get admin role and managed mosque
        $stmtAdmin = $pdo->prepare("SELECT role, managed_mosque_id FROM users WHERE id = ?");
        $stmtAdmin->execute([$adminId]);
        $currAdmin = $stmtAdmin->fetch();

        $whereClauses = [];
        $params = [];

        if ($currAdmin && $currAdmin['role'] === 'admin') {
            $whereClauses[] = "u.favorite_mosque_id = ?";
            $params[] = $currAdmin['managed_mosque_id'];
        }

        if ($search) {
            $whereClauses[] = "(u.username LIKE ? OR u.email LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $query = "SELECT u.id, u.username, u.email, u.role, u.avatar, u.status, u.created_at, u.managed_mosque_id, m.name as mosque_name 
                  FROM users u 
                  LEFT JOIN mosques m ON u.managed_mosque_id = m.id";

        if (count($whereClauses) > 0) {
            $query .= " WHERE " . implode(" AND ", $whereClauses);
        }

        $query .= " ORDER BY created_at DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'users' => $users]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        $userId = $data['userId'];
        $action = $data['action']; // e.g., 'ban', 'activate', 'set_role'

        if ($action === 'status') {
            $newStatus = $data['status'];
            $stmt = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
            $stmt->execute([$newStatus, $userId]);
        }
        elseif ($action === 'role') {
            $newRole = $data['role'];
            $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
            $stmt->execute([$newRole, $userId]);
        }
        elseif ($action === 'assign_mosque') {
            $mosqueId = $data['mosqueId']; // Can be null to unassign
            $stmt = $pdo->prepare("UPDATE users SET managed_mosque_id = ? WHERE id = ?");
            $stmt->execute([$mosqueId, $userId]);
        }

        echo json_encode(['success' => true]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
