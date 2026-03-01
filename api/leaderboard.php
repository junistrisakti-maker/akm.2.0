<?php
header('Content-Type: application/json');
require_once 'config.php';
require_once 'gamification_engine.php';

$method = $_SERVER['REQUEST_METHOD'];
$engine = new GamificationEngine($pdo);

if ($method === 'GET') {
    $type = $_GET['type'] ?? 'global';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

    try {
        if ($type === 'global') {
            $currentUserId = $_GET['currentUserId'] ?? null;

            $stmt = $pdo->prepare("
                SELECT u.id, u.username, u.avatar, u.xp, u.level,
                (SELECT COUNT(*) FROM buddies b WHERE 
                    (b.user_id = :current_id AND b.buddy_id = u.id) OR 
                    (b.buddy_id = :current_id AND b.user_id = u.id)
                ) as is_buddy
                FROM users u 
                WHERE u.status = 'active' AND u.is_private_mode = 0
                ORDER BY u.xp DESC 
                LIMIT :limit
            ");
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':current_id', $currentUserId);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Add Rank Name and Visuals
            foreach ($users as &$user) {
                $visuals = $engine->getRankVisuals($user['level']);
                $user['rank_name'] = $visuals['name'];
                $user['rank_color'] = $visuals['color'];
                $user['is_buddy'] = (int)$user['is_buddy'] > 0;

                // Add rank for UI consumption if missing
                if (!isset($user['rank'])) {
                    static $rankCount = 1;
                    $user['rank'] = $rankCount++;
                }
            }

            echo json_encode(['status' => 'success', 'data' => $users]);
        }
        elseif ($type === 'circle') {
            $circleId = $_GET['circleId'] ?? null;
            if (!$circleId) {
                http_response_code(400);
                echo json_encode(['error' => 'circleId is required']);
                exit;
            }

            $stmt = $pdo->prepare("
                SELECT u.id, u.username, u.avatar, u.xp, u.level 
                FROM users u
                JOIN circle_members cm ON u.id = cm.user_id
                WHERE cm.circle_id = ? AND u.status = 'active'
                ORDER BY u.xp DESC 
                LIMIT :limit
            ");
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(1, $circleId); // Note: positional and named can sometimes conflict, let's stick to named if possible or positional
            // Actually, PDO doesn't like mixing. Let's fix circle too.
            $stmt = $pdo->prepare("
                SELECT u.id, u.username, u.avatar, u.xp, u.level 
                FROM users u
                JOIN circle_members cm ON u.id = cm.user_id
                WHERE cm.circle_id = :circle_id AND u.status = 'active'
                ORDER BY u.xp DESC 
                LIMIT :limit
            ");
            $stmt->bindValue(':circle_id', $circle_id);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($users as &$user) {
                $visuals = $engine->getRankVisuals($user['level']);
                $user['rank_name'] = $visuals['name'];
                if (!isset($user['rank'])) {
                    static $circleRankCount = 1;
                    $user['rank'] = $circleRankCount++;
                }
            }

            echo json_encode(['status' => 'success', 'data' => $users]);
        }
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
