<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// RBAC check: Only Superadmin can manage challenges
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
    $action = $_GET['action'] ?? '';
    $user_id = $_GET['user_id'] ?? 0;
    $admin_id = $_GET['admin_id'] ?? 0;

    if ($action === 'list') {
        try {
            // Get all challenges
            // If admin_id is provided and is superadmin, fetch even inactive ones
            // If user_id is provided, filter by mosque_id (fetch public or node-specific)
            $query = "SELECT * FROM challenges";
            $where = [];
            $params = [];

            if (!$admin_id || !checkSuperadmin($pdo, $admin_id)) {
                $where[] = "(period_type = 'always' OR (period_type = 'seasonal' AND end_date >= CURRENT_DATE))";
            }



            if (!empty($where)) {
                $query .= " WHERE " . implode(" AND ", $where);
            }

            $query .= " ORDER BY created_at DESC";

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $challenges = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // If user_id provided, get their progress
            if ($user_id) {
                // ... same progress logic ...
                $stmt = $pdo->prepare("SELECT challenge_id, current_count, is_completed FROM user_challenges WHERE user_id = ?");
                $stmt->execute([$user_id]);
                $progress = $stmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($challenges as &$c) {
                    $c['user_progress'] = 0;
                    $c['is_completed'] = 0;
                    foreach ($progress as $p) {
                        if ($p['challenge_id'] == $c['id']) {
                            $c['user_progress'] = $p['current_count'];
                            $c['is_completed'] = $p['is_completed'];
                        }
                    }
                }
            }

            echo json_encode($challenges);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch challenges: ' . $e->getMessage()]);
        }
    }
}
elseif ($method === 'POST' || $method === 'PUT' || $method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $admin_id = $data['admin_id'] ?? (($_GET['admin_id'] ?? 0));

    if (!checkSuperadmin($pdo, $admin_id)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: Superadmin access required']);
        exit();
    }

    if ($method === 'POST') {
        $title = $data['title'] ?? '';
        $description = $data['description'] ?? '';
        $target_count = $data['target_count'] ?? 1;
        $points_reward = $data['points_reward'] ?? $data['points'] ?? 0;

        try {
            $stmt = $pdo->prepare("INSERT INTO challenges (title, description, target_count, points_reward) VALUES (?, ?, ?, ?)");
            $stmt->execute([$title, $description, $target_count, $points_reward]);
            echo json_encode(['message' => 'Challenge created successfully']);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($method === 'PUT') {
        $id = $data['id'] ?? 0;
        $title = $data['title'] ?? '';
        $description = $data['description'] ?? '';
        $target_count = $data['target_count'] ?? 0;
        $points_reward = $data['points_reward'] ?? $data['points'] ?? 0;
        $is_active = $data['is_active'] ?? 1;

        try {
            $stmt = $pdo->prepare("UPDATE challenges SET title = ?, description = ?, target_count = ?, points_reward = ?, is_active = ? WHERE id = ?");
            $stmt->execute([$title, $description, $target_count, $points_reward, $is_active, $id]);
            echo json_encode(['message' => 'Challenge updated successfully']);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($method === 'DELETE') {
        $id = $data['id'] ?? 0;
        try {
            $stmt = $pdo->prepare("DELETE FROM challenges WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['message' => 'Challenge deleted successfully']);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
?>
