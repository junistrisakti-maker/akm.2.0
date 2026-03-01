<?php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    if ($action === 'getCounts') {
        try {
            $stmt = $pdo->query("SELECT * FROM global_counters WHERE is_active = 1 AND (end_time IS NULL OR end_time > NOW())");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'getPrayers') {
        $currUserId = $_GET['currentUserId'] ?? null;
        try {
            $stmt = $pdo->prepare("
                SELECT p.*, u.username, u.avatar,
                (SELECT COUNT(*) FROM prayer_aamiins WHERE prayer_id = p.id AND user_id = ?) as is_aamiined
                FROM social_prayers p 
                JOIN users u ON p.user_id = u.id 
                ORDER BY p.created_at DESC 
                LIMIT 50
            ");
            $stmt->execute([$currUserId]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'getActivityFeed') {
        try {
            // Aggregate activities
            // 1. Recent Check-ins
            $stmt1 = $pdo->query("
                SELECT 'checkin' as type, u.username, m.name as detail, c.created_at 
                FROM check_ins c 
                JOIN users u ON c.user_id = u.id 
                JOIN mosques m ON c.masjid_id = m.id 
                ORDER BY c.created_at DESC LIMIT 10
            ");
            $checkins = $stmt1->fetchAll(PDO::FETCH_ASSOC);

            // 2. Recent Rank Ups (from xp_logs)
            $stmt2 = $pdo->query("
                SELECT 'rankup' as type, u.username, l.description as detail, l.created_at 
                FROM xp_logs l 
                JOIN users u ON l.user_id = u.id 
                WHERE l.action_type = 'rank_up' 
                ORDER BY l.created_at DESC LIMIT 10
            ");
            $rankups = $stmt2->fetchAll(PDO::FETCH_ASSOC);

            // 3. Recent Prayers
            $stmt3 = $pdo->query("
                SELECT 'prayer' as type, u.username, p.content as detail, p.created_at 
                FROM social_prayers p 
                JOIN users u ON p.user_id = u.id 
                ORDER BY p.created_at DESC LIMIT 10
            ");
            $prayers = $stmt3->fetchAll(PDO::FETCH_ASSOC);

            // 4. Centralized Social Activities
            $stmt4 = $pdo->query("
                SELECT type, 'System' as username, detail, created_at 
                FROM social_activities 
                ORDER BY created_at DESC LIMIT 10
            ");
            $social_acts = $stmt4->fetchAll(PDO::FETCH_ASSOC);

            $feed = array_merge($checkins, $rankups, $prayers, $social_acts);
            usort($feed, function ($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            echo json_encode(array_slice($feed, 0, 20));
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'getFlashChallenge') {
        try {
            $stmt = $pdo->query("SELECT * FROM flash_challenges WHERE is_active = 1 AND NOW() BETWEEN start_time AND end_time LIMIT 1");
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'getSohibTips') {
        $tips = [
            "Sudahkah kamu tilawah hari ini? Satu juz hanya butuh 20 menit!",
            "Double XP aktif setiap hari Jumat! Pastikan check-in di Masjid hari ini.",
            "Ajak 3 temanmu bergabung di Circle untuk dapatkan Badge NEXUS!",
            "Sedekah subuh memiliki keutamaan luar biasa, coba fitur Digital Sadaqah!",
            "Jangan lupa aminkan doa saudara-saudaramu di Simpul Doa Ummat."
        ];
        echo json_encode(['tip' => $tips[array_rand($tips)]]);
    }
    elseif ($action === 'getLiveInteractions') {
        try {
            // Get aamiins in the last 15 seconds to trigger live animations
            $stmt = $pdo->query("
                SELECT prayer_id, user_id 
                FROM prayer_aamiins 
                WHERE created_at > (NOW() - INTERVAL 15 SECOND)
                ORDER BY created_at DESC 
                LIMIT 50
            ");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    if ($action === 'tally') {
        $key = $data['counter_key'] ?? '';
        $increment = $data['increment'] ?? 1;
        if (!$key) {
            http_response_code(400);
            echo json_encode(['error' => 'Counter key required']);
            exit;
        }

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("UPDATE global_counters SET current_value = current_value + ? WHERE counter_key = ?");
            $stmt->execute([$increment, $key]);

            $stmtGet = $pdo->prepare("SELECT * FROM global_counters WHERE counter_key = ?");
            $stmtGet->execute([$key]);
            $counter = $stmtGet->fetch(PDO::FETCH_ASSOC);

            // Log activity occasionally to central feed (e.g. every 100 or when multiple users tap)
            if ($counter['current_value'] % 100 == 0) {
                $stmtLog = $pdo->prepare("INSERT INTO social_activities (type, detail) VALUES ('tally_milestone', ?)");
                $msg = "Ummat mencapai " . number_format($counter['current_value']) . " " . $counter['title'] . "! ✨";
                $stmtLog->execute([$msg]);
            }

            // Check Goal Achievement
            if ($counter['current_value'] >= $counter['target_value'] && $counter['is_notified'] == 0) {
                // Goal Reached!
                $stmtAchieved = $pdo->prepare("UPDATE global_counters SET is_notified = 1 WHERE counter_key = ?");
                $stmtAchieved->execute([$key]);

                // Record achievement in central feed
                $stmtLog = $pdo->prepare("INSERT INTO social_activities (type, detail) VALUES ('goal_achieved', ?)");
                $achMsg = "🏆 ALHAMDULILLAH! Target " . $counter['title'] . " sebayak " . number_format($counter['target_value']) . " TELAH TERCAPAI! Jazakumullah!";
                $stmtLog->execute([$achMsg]);

                // Notification for global ticker
                $stmtNotifGlobal = $pdo->prepare("INSERT INTO notifications (user_id, type, message) SELECT id, 'global', ? FROM users");
                $stmtNotifGlobal->execute([$achMsg]);
            }

            $pdo->commit();
            echo json_encode($counter);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'postPrayer') {
        $userId = $data['userId'] ?? null;
        $content = $data['content'] ?? '';
        $isAnonymous = $data['isAnonymous'] ?? 0;

        if (!$userId || !$content) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing data']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO social_prayers (user_id, content, is_anonymous) VALUES (?, ?, ?)");
            $stmt->execute([$userId, $content, $isAnonymous]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'aamiin') {
        $prayerId = $data['prayerId'] ?? null;
        $userId = $data['userId'] ?? null;

        if (!$prayerId || !$userId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing data']);
            exit;
        }

        try {
            $pdo->beginTransaction();
            // 1. Check if already aamiin
            $stmtCheck = $pdo->prepare("SELECT id FROM prayer_aamiins WHERE prayer_id = ? AND user_id = ?");
            $stmtCheck->execute([$prayerId, $userId]);
            if ($stmtCheck->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Sudah mengaminkan doa ini 🙏']);
                $pdo->rollBack();
                exit;
            }

            // 2. Insert log
            $stmtLog = $pdo->prepare("INSERT INTO prayer_aamiins (prayer_id, user_id) VALUES (?, ?)");
            $stmtLog->execute([$prayerId, $userId]);

            // 3. Update count
            $stmtUpdate = $pdo->prepare("UPDATE social_prayers SET aamiin_count = aamiin_count + 1 WHERE id = ?");
            $stmtUpdate->execute([$prayerId]);

            // 4. Send notification to owner (if not self)
            $stmtOwner = $pdo->prepare("SELECT user_id FROM social_prayers WHERE id = ?");
            $stmtOwner->execute([$prayerId]);
            $ownerId = $stmtOwner->fetchColumn();

            if ($ownerId) {
                // Reward both users (Legacy logic)
                // Owner gets +2 XP
                require_once 'gamification_engine.php';
                $engine = new GamificationEngine($pdo);
                // Owner gets notification (XP handled via action if needed)
                // $engine->awardXP($ownerId, 'prayer_aamiin_received', ['prayer_id' => $prayerId]);

                // Aamiiner (Sender) gets XP and Mission Progress
                if ($ownerId != $userId) {
                    $engine->awardXP($userId, 'prayer_aamiin', ['prayer_id' => $prayerId]);
                }

                // Get count for notifications
                $stmtCount = $pdo->prepare("SELECT aamiin_count FROM social_prayers WHERE id = ?");
                $stmtCount->execute([$prayerId]);
                $count = $stmtCount->fetchColumn();

                if ($count % 5 == 0 || $count == 1) { // Notify on first, then every 5
                    $stmtNotif = $pdo->prepare("INSERT INTO notifications (user_id, type, message) VALUES (?, 'prayer', ?)");
                    $msg = "Alhamdulillah, Simpul Doamu baru saja diaminkan oleh $count orang! ✨";
                    $stmtNotif->execute([$ownerId, $msg]);
                }
            }

            $pdo->commit();
            echo json_encode(['success' => true]);
        }
        catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
?>
