<?php
header('Content-Type: application/json');
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $userId = $data['userId'] ?? null;
    $type = $data['type'] ?? null; // 'digital_asset' or 'infaq_voucher'
    $points = $data['points'] ?? 0;

    if (!$userId || !$type) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing parameters']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // Check user XP
        $stmtUser = $pdo->prepare("SELECT xp FROM users WHERE id = ?");
        $stmtUser->execute([$userId]);
        $user = $stmtUser->fetch();

        if (!$user || $user['xp'] < $points) {
            echo json_encode(['error' => 'XP tidak cukup']);
            exit;
        }

        // Deduct XP
        $stmtUpdate = $pdo->prepare("UPDATE users SET xp = xp - ? WHERE id = ?");
        $stmtUpdate->execute([$points, $userId]);

        // Log transaction
        $stmtLog = $pdo->prepare("INSERT INTO xp_logs (user_id, action_type, xp_earned, metadata) VALUES (?, ?, ?, ?)");
        $stmtLog->execute([$userId, 'redemption_' . $type, -$points, json_encode($data['metadata'] ?? [])]);

        $pdo->commit();
        echo json_encode(['status' => 'success', 'message' => 'Penukaran berhasil']);

    }
    catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
