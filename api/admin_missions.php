<?php
require_once 'config.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$adminId = $_REQUEST['admin_id'] ?? null;

// Basic Security Check
if (!$adminId) {
    echo json_encode(['success' => false, 'error' => 'Admin ID required']);
    exit;
}

$stmtAdmin = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmtAdmin->execute([$adminId]);
$adminRole = $stmtAdmin->fetchColumn();

if ($adminRole !== 'superadmin' && $adminRole !== 'admin') {
    echo json_encode(['success' => false, 'error' => 'Unauthorized: Admin access required']);
    exit;
}

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM daily_missions ORDER BY created_at DESC");
        $missions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'missions' => $missions]);
    }
    catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['title'], $data['action_type'], $data['target_count'], $data['xp_reward'])) {
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO daily_missions (title, description, action_type, target_count, xp_reward, icon) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['title'],
            $data['description'] ?? '',
            $data['action_type'],
            $data['target_count'],
            $data['xp_reward'],
            $data['icon'] ?? 'Target'
        ]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    }
    catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;

    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'ID required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE daily_missions SET title = ?, description = ?, action_type = ?, target_count = ?, xp_reward = ?, icon = ? WHERE id = ?");
        $stmt->execute([
            $data['title'],
            $data['description'],
            $data['action_type'],
            $data['target_count'],
            $data['xp_reward'],
            $data['icon'],
            $id
        ]);
        echo json_encode(['success' => true]);
    }
    catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'ID required']);
        exit;
    }

    try {
        $pdo->beginTransaction();
        // Also delete progress for this mission to keep DB clean
        $stmtP = $pdo->prepare("DELETE FROM user_mission_progress WHERE mission_id = ?");
        $stmtP->execute([$id]);

        $stmt = $pdo->prepare("DELETE FROM daily_missions WHERE id = ?");
        $stmt->execute([$id]);

        $pdo->commit();
        echo json_encode(['success' => true]);
    }
    catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
