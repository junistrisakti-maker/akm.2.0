<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
require 'config.php';
require_once 'realtime_helper.php';

$action = $_GET['action'] ?? '';
$currentUserId = $_GET['userId'] ?? null;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'getBuddies') {
        if (!$currentUserId) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID required']);
            exit;
        }

        try {
            // Get accepted buddies with their latest status and activity
            // Logic: 
            // 1. If checked in at a masjid within last 2 hours => "At [Masjid Name]"
            // 2. Else use current_activity
            // 3. Else "Last seen [Time]"
            $stmt = $pdo->prepare("
                SELECT 
                    u.id, u.username, u.avatar, u.points, u.streak, u.current_activity, u.last_seen,
                    m.name as masjid_name, ci.created_at as checkin_time
                FROM users u
                JOIN buddies b ON (u.id = b.buddy_id AND b.user_id = ?) 
                                OR (u.id = b.user_id AND b.buddy_id = ?)
                LEFT JOIN (
                    SELECT user_id, masjid_id, MAX(created_at) as created_at
                    FROM check_ins
                    WHERE created_at > DATE_SUB(NOW(), INTERVAL 2 HOUR)
                    GROUP BY user_id, masjid_id
                ) ci ON u.id = ci.user_id
                LEFT JOIN mosques m ON ci.masjid_id = m.id
                WHERE b.status = 'accepted' AND u.id != ?
                ORDER BY u.last_seen DESC
            ");
            $stmt->execute([$currentUserId, $currentUserId, $currentUserId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // DEBUG
            // error_log("Buddies for user $currentUserId: " . count($rows));

            $buddies = array_map(function ($row) {
                $now = new DateTime();
                $lastSeen = new DateTime($row['last_seen']);
                $diff = $now->getTimestamp() - $lastSeen->getTimestamp();

                $isActive = ($diff < 300); // Active if seen in last 5 minutes

                $status = "Offline";
                if ($row['masjid_name']) {
                    $status = "At " . $row['masjid_name'];
                }
                elseif ($row['current_activity']) {
                    $status = $row['current_activity'];
                }
                else {
                    if ($diff < 60)
                        $status = "Just now";
                    elseif ($diff < 3600)
                        $status = floor($diff / 60) . "m ago";
                    else
                        $status = floor($diff / 3600) . "h ago";
                }

                return [
                'id' => $row['id'],
                'name' => $row['username'],
                'avatar' => $row['avatar'] ?: substr($row['username'], 0, 1),
                'points' => $row['points'],
                'streak' => $row['streak'],
                'status' => $status,
                'isActive' => $isActive
                ];
            }, $rows);

            echo json_encode($buddies);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $userId = $data['userId'] ?? null;
    $buddyId = $data['buddyId'] ?? null;

    if ($action === 'addBuddy') {
        if (!$userId || !$buddyId) {
            http_response_code(400);
            echo json_encode(['error' => 'Both User IDs required']);
            exit;
        }

        if ($userId == $buddyId) {
            http_response_code(400);
            echo json_encode(['error' => 'You cannot add yourself as a buddy']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT IGNORE INTO buddies (user_id, buddy_id, status) VALUES (?, ?, 'accepted')");
            $stmt->execute([$userId, $buddyId]);

            if ($stmt->rowCount() === 0) {
                echo json_encode(['message' => 'Already buddies!']);
                exit;
            }

            $stmtUser = $pdo->prepare("SELECT username FROM users WHERE id = ?");
            $stmtUser->execute([$userId]);
            $sender = $stmtUser->fetch();
            $senderName = $sender ? $sender['username'] : 'Someone';

            $stmtNotif = $pdo->prepare("INSERT INTO notifications (user_id, type, message) VALUES (?, 'buddy', ?)");
            $stmtNotif->execute([$buddyId, "$senderName added you as a Prayer Buddy! 🤝"]);

            // Real-time Notification
            RealtimeHelper::notifyUser($buddyId, 'buddy', "$senderName mendambahkan Anda sebagai Prayer Buddy! 🤝", ['senderId' => $userId]);

            echo json_encode(['message' => 'Buddy added!']);
        }
        catch (PDOException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Already buddies or request pending']);
        }
    }
    elseif ($action === 'updateActivity') {
        $activity = $data['activity'] ?? '';
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID required', 'received' => $data]);
            exit;
        }
        // Log to a file we can read
        // file_put_contents('social_debug.log', date('H:i:s')." UpdateActivity for $userId: $activity\n", FILE_APPEND);
        try {
            $stmt = $pdo->prepare("UPDATE users SET current_activity = ?, last_seen = NOW() WHERE id = ?");
            $stmt->execute([$activity, $userId]);
            echo json_encode(['success' => true, 'message' => 'Activity updated']);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'nudgeBuddy') {
        if (!$userId || !$buddyId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing userId or buddyId']);
            exit;
        }
        try {
            $stmtUser = $pdo->prepare("SELECT username FROM users WHERE id = ?");
            $stmtUser->execute([$userId]);
            $sender = $stmtUser->fetch();
            $senderName = $sender ? $sender['username'] : 'Seseorang';

            $message = "$senderName menyapa Anda di Prayer Circle! 🔔";

            $stmtNotif = $pdo->prepare("INSERT INTO notifications (user_id, type, message) VALUES (?, 'nudge', ?)");
            $stmtNotif->execute([$buddyId, $message]);

            // Real-time Notification
            RealtimeHelper::notifyUser($buddyId, 'nudge', $message, ['senderId' => $userId]);

            echo json_encode(['success' => true, 'message' => 'Nudge sent!']);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
?>
