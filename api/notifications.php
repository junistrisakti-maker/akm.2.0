<?php
header('Content-Type: application/json');
require 'config.php';

$action = $_GET['action'] ?? '';
$userId = $_GET['userId'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20");
        $stmt->execute([$userId]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($notifications);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'markRead') {
        $data = json_decode(file_get_contents("php://input"), true);
        $notifId = $data['notificationId'] ?? null;

        try {
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
            $stmt->execute([$notifId, $userId]);
            echo json_encode(['message' => 'Notification marked as read']);
        }
        catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'sendSpirit') {
        $data = json_decode(file_get_contents("php://input"), true);
        $targetUserId = $data['targetUserId'] ?? null;
        $senderName = $data['senderName'] ?? 'Seseorang';

        if (!$targetUserId) {
            http_response_code(400);
            echo json_encode(['error' => 'Target User ID required']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO notifications (user_id, type, message) VALUES (?, 'spirit', ?)");
            $message = "$senderName mengirimkan 'Spirit ✨' untukmu! Semangat ibadahnya! 🔥";
            $stmt->execute([$targetUserId, $message]);
            echo json_encode(['message' => 'Spirit sent!']);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
?>
