<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['userId'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID required']);
    exit;
}

if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare("
            SELECT b.*, ub.earned_at 
            FROM badges b 
            JOIN user_badges ub ON b.id = ub.badge_id 
            WHERE ub.user_id = ?
            ORDER BY ub.earned_at DESC
        ");
        $stmt->execute([$userId]);
        $earned = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Also fetch all available badges to show progress or lock state (optional)
        $stmtAll = $pdo->query("SELECT * FROM badges");
        $allBadges = $stmtAll->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'earned' => $earned,
            'all' => $allBadges
        ]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
