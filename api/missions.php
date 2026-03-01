<?php
require_once 'config.php';
require_once 'gamification_engine.php';

header('Content-Type: application/json');

$userId = $_SESSION['user_id'] ?? 1; // Fallback for dev
$method = $_SERVER['REQUEST_METHOD'];

$engine = new GamificationEngine($pdo);
$today = date('Y-m-d');

if ($method === 'GET') {
    try {
        // Fetch all missions and join with user progress for today
        $stmt = $pdo->prepare("
            SELECT 
                dm.*,
                COALESCE(ump.current_count, 0) as current_count,
                COALESCE(ump.status, 'in_progress') as status
            FROM daily_missions dm
            LEFT JOIN user_mission_progress ump ON dm.id = ump.mission_id 
                AND ump.user_id = ? 
                AND ump.last_updated_date = ?
        ");
        $stmt->execute([$userId, $today]);
        $missions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'missions' => $missions]);
    }
    catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $missionId = $input['mission_id'] ?? null;

    if (!$missionId) {
        echo json_encode(['success' => false, 'error' => 'Mission ID required']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // Check if mission is actually completed but not yet claimed
        $stmt = $pdo->prepare("
            SELECT ump.*, dm.xp_reward, dm.title 
            FROM user_mission_progress ump
            JOIN daily_missions dm ON ump.mission_id = dm.id
            WHERE ump.user_id = ? AND ump.mission_id = ? AND ump.last_updated_date = ?
        ");
        $stmt->execute([$userId, $missionId, $today]);
        $progress = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$progress) {
            echo json_encode(['success' => false, 'error' => 'Misi tidak ditemukan']);
            $pdo->rollBack();
            exit;
        }

        if ($progress['status'] !== 'completed') {
            echo json_encode(['success' => false, 'error' => 'Misi belum selesai atau sudah diklaim']);
            $pdo->rollBack();
            exit;
        }

        // Mark as claimed
        $stmtClaim = $pdo->prepare("UPDATE user_mission_progress SET status = 'claimed' WHERE id = ?");
        $stmtClaim->execute([$progress['id']]);

        // Award XP via engine (using a special internal action to avoid daily limits)
        $xpReward = $progress['xp_reward'];
        $stmtXp = $pdo->prepare("UPDATE users SET xp = xp + ? WHERE id = ?");
        $stmtXp->execute([$xpReward, $userId]);

        // Log XP
        $stmtLog = $pdo->prepare("INSERT INTO xp_logs (user_id, action_type, xp_earned, metadata) VALUES (?, 'mission_reward', ?, ?)");
        $stmtLog->execute([$userId, $xpReward, json_encode(['mission_title' => $progress['title']])]);

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'xp_earned' => $xpReward,
            'message' => "Selamat! Kamu mendapatkan $xpReward XP dari misi: " . $progress['title']
        ]);

    }
    catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
