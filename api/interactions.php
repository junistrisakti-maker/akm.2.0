<?php
header('Content-Type: application/json');
require 'config.php';

// POST interaction
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $userId = $data['userId'] ?? null;
    $postId = $data['postId'] ?? null;
    $type = $data['type'] ?? null; // 'like', 'save', or 'share'

    if (!$userId || !$postId || !in_array($type, ['like', 'save', 'share'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing or invalid parameters']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        if ($type === 'share') {
            // Simple increment for shares
            $stmtUpdate = $pdo->prepare("UPDATE posts SET shares = shares + 1 WHERE id = ?");
            $stmtUpdate->execute([$postId]);
            $pdo->commit();

            // --- GAMIFICATION INTEGRATION ---
            require_once 'gamification_engine.php';
            $engine = new GamificationEngine($pdo);
            $xpResult = $engine->awardXP($userId, 'share', ['postId' => $postId]);
            // --------------------------------

            echo json_encode(['status' => 'added', 'message' => 'Share count updated', 'gamification' => $xpResult]);
            exit;
        }

        // Check if interaction exists (for like/save toggle)
        $stmtCheck = $pdo->prepare("SELECT id FROM post_interactions WHERE user_id = ? AND post_id = ? AND interaction_type = ?");
        $stmtCheck->execute([$userId, $postId, $type]);
        $existing = $stmtCheck->fetch();

        if ($existing) {
            // Remove interaction (Toggle off)
            $stmtDelete = $pdo->prepare("DELETE FROM post_interactions WHERE id = ?");
            $stmtDelete->execute([$existing['id']]);

            // Decrement count in posts table
            $countCol = ($type === 'like') ? 'likes' : 'saves';
            $stmtUpdate = $pdo->prepare("UPDATE posts SET $countCol = GREATEST(0, $countCol - 1) WHERE id = ?");
            $stmtUpdate->execute([$postId]);

            $pdo->commit();
            echo json_encode(['status' => 'removed', 'message' => ucfirst($type) . ' removed']);
        }
        else {
            // Add interaction (Toggle on)
            $stmtInsert = $pdo->prepare("INSERT INTO post_interactions (user_id, post_id, interaction_type) VALUES (?, ?, ?)");
            $stmtInsert->execute([$userId, $postId, $type]);

            // Increment count in posts table
            $countCol = ($type === 'like') ? 'likes' : 'saves';
            $stmtUpdate = $pdo->prepare("UPDATE posts SET $countCol = $countCol + 1 WHERE id = ?");
            $stmtUpdate->execute([$postId]);

            $pdo->commit();

            // --- GAMIFICATION INTEGRATION ---
            require_once 'gamification_engine.php';
            $engine = new GamificationEngine($pdo);
            $xpResult = $engine->awardXP($userId, 'post_interaction', ['type' => $type, 'postId' => $postId]);
            // --------------------------------

            echo json_encode(['status' => 'added', 'message' => ucfirst($type) . ' added', 'gamification' => $xpResult]);
        }
    }
    catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
