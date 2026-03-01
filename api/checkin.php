<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    if ($action === 'checkin') {
        $masjid_id = $data['masjid_id'] ?? 0;
        $user_id = $data['user_id'] ?? 0;

        if (!$masjid_id || !$user_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing masjid_id or user_id']);
            exit();
        }

        try {
            // Check if already checked in today (optional but good for gamification balance)
            /*
             $stmt = $pdo->prepare("SELECT id FROM check_ins WHERE user_id = ? AND masjid_id = ? AND DATE(created_at) = CURDATE()");
             $stmt->execute([$user_id, $masjid_id]);
             if ($stmt->fetch()) {
             echo json_encode(['error' => 'You already checked in today!']);
             exit();
             }
             */

            $points = 10;
            $stmt = $pdo->prepare("INSERT INTO check_ins (user_id, masjid_id, points_earned) VALUES (?, ?, ?)");
            $stmt->execute([$user_id, $masjid_id, $points]);

            // Update user total points and last_seen
            $stmt = $pdo->prepare("UPDATE users SET points = points + ?, last_seen = NOW() WHERE id = ?");
            $stmt->execute([$points, $user_id]);

            $stmt = $pdo->prepare("UPDATE mosques SET points = points + ? WHERE id = ?");
            $stmt->execute([$points, $masjid_id]);

            // Track Challenge Progress
            require_once 'challenge_helper.php';
            updateChallengeProgress($pdo, $user_id, 'checkin');

            // --- GAMIFICATION INTEGRATION ---
            require_once 'gamification_engine.php';
            $engine = new GamificationEngine($pdo);
            $xpResult = $engine->awardXP($user_id, 'check_in', ['masjid_id' => $masjid_id]);
            // --------------------------------

            echo json_encode([
                'message' => 'Check-in successful!',
                'points_earned' => $points,
                'new_total_points' => $points,
                'gamification' => $xpResult
            ]);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Check-in failed: ' . $e->getMessage()]);
        }
    }
}
?>
