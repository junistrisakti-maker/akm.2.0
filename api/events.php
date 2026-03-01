<?php
header('Content-Type: application/json');
require 'config.php';
require_once 'realtime_helper.php';

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $category = $_GET['category'] ?? null;
    $mosqueId = $_GET['mosqueId'] ?? null;

    try {
        $userId = $_GET['userId'] ?? null;
        $sql = "SELECT e.*, m.name as mosque_name 
                FROM events e 
                LEFT JOIN mosques m ON e.mosque_id = m.id 
                WHERE e.status = 'active'";
        $params = [];

        if ($category) {
            $sql .= " AND e.category = ?";
            $params[] = $category;
        }
        if ($mosqueId) {
            $sql .= " AND e.mosque_id = ?";
            $params[] = $mosqueId;
        }

        $sql .= " ORDER BY e.date ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // If userId is provided, check RSVP status for each event
        if ($userId) {
            foreach ($events as &$event) {
                $stmtRSVP = $pdo->prepare("SELECT status, qr_code_token FROM event_attendees WHERE event_id = ? AND user_id = ?");
                $stmtRSVP->execute([$event['id'], $userId]);
                $rsvp = $stmtRSVP->fetch(PDO::FETCH_ASSOC);
                $event['rsvp_status'] = $rsvp ? $rsvp['status'] : null;
                $event['qr_code_token'] = $rsvp ? $rsvp['qr_code_token'] : null;
            }
        }

        echo json_encode($events);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'join' || $action === 'rsvp') {
        $data = json_decode(file_get_contents("php://input"), true);
        $userId = $data['userId'] ?? null;
        $eventId = $data['eventId'] ?? null;

        if (!$userId || !$eventId) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID and Event ID required']);
            exit;
        }

        try {
            $pdo->beginTransaction();

            // Generate unique QR token
            $qrToken = bin2hex(random_bytes(16));

            // Insert registration with token
            $stmt = $pdo->prepare("INSERT INTO event_attendees (event_id, user_id, qr_code_token, status) VALUES (?, ?, ?, 'rsvp')");
            $stmt->execute([$eventId, $userId, $qrToken]);

            // Update count
            $stmtUpdate = $pdo->prepare("UPDATE events SET attendees_count = attendees_count + 1 WHERE id = ?");
            $stmtUpdate->execute([$eventId]);

            // Get event title
            $stmtTitle = $pdo->prepare("SELECT title FROM events WHERE id = ?");
            $stmtTitle->execute([$eventId]);
            $event = $stmtTitle->fetch();
            $eventTitle = $event ? $event['title'] : 'the event';

            // Notify the user
            $stmtNotif = $pdo->prepare("INSERT INTO notifications (user_id, type, message) VALUES (?, 'event', ?)");
            $stmtNotif->execute([$userId, "Alhamdulillah! Reservasi '$eventTitle' berhasil. Tunjukkan QR Code-mu saat hadir ya! 🕌🎟️"]);

            // Real-time Notification
            RealtimeHelper::notifyUser($userId, 'event', "Alhamdulillah! Reservasi '$eventTitle' berhasil. Tunjukkan QR Code-mu saat hadir ya! 🕌🎟️");

            $pdo->commit();
            echo json_encode(['message' => 'RSVP Success!', 'qr_code_token' => $qrToken]);
        }
        catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Sudah terdaftar di acara ini']);
        }
    }
    elseif ($action === 'checkIn') {
        $data = json_decode(file_get_contents("php://input"), true);
        $qrToken = $data['qrToken'] ?? '';
        $adminId = $data['adminId'] ?? null; // Admin performing the scan

        if (!$qrToken) {
            http_response_code(400);
            echo json_encode(['error' => 'QR Token required']);
            exit;
        }

        try {
            $pdo->beginTransaction();

            // 1. Find attendee and event info
            $stmt = $pdo->prepare("SELECT ea.*, e.title, e.creator_id, e.mosque_id FROM event_attendees ea JOIN events e ON ea.event_id = e.id WHERE ea.qr_code_token = ?");
            $stmt->execute([$qrToken]);
            $attendee = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$attendee) {
                http_response_code(404);
                echo json_encode(['error' => 'Ticket invalid atau tidak ditemukan']);
                $pdo->rollBack();
                exit;
            }

            if ($attendee['status'] === 'checked_in') {
                http_response_code(400);
                echo json_encode(['error' => 'Ticket sudah pernah digunakan']);
                $pdo->rollBack();
                exit;
            }

            // 2. Validate Scanner
            $stmtScanner = $pdo->prepare("SELECT role, level FROM users WHERE id = ?");
            $stmtScanner->execute([$adminId]);
            $scanner = $stmtScanner->fetch(PDO::FETCH_ASSOC);

            if (!$scanner) {
                http_response_code(403);
                echo json_encode(['error' => 'Scanner tidak valid']);
                $pdo->rollBack();
                exit;
            }

            // Level 3 Requirement (Exception for superadmin)
            if ((int)$scanner['level'] < 3 && $scanner['role'] !== 'superadmin') {
                http_response_code(403);
                echo json_encode(['error' => 'Maaf, hanya user minimal Level 3 yang bisa menjadi petugas scan.']);
                $pdo->rollBack();
                exit;
            }

            // Check if appointed or creator or superadmin
            $stmtAuth = $pdo->prepare("SELECT id FROM event_scanners WHERE event_id = ? AND user_id = ?");
            $stmtAuth->execute([$attendee['event_id'], $adminId]);
            $isAppointed = $stmtAuth->fetch();

            if (!$isAppointed && (int)$adminId !== (int)$attendee['creator_id'] && $scanner['role'] !== 'superadmin') {
                http_response_code(403);
                echo json_encode(['error' => 'Kamu tidak ditunjuk sebagai petugas scan untuk acara ini.']);
                $pdo->rollBack();
                exit;
            }

            // 3. Perform Check-in
            $stmtUpdate = $pdo->prepare("UPDATE event_attendees SET status = 'checked_in', checked_in_at = NOW() WHERE id = ?");
            $stmtUpdate->execute([$attendee['id']]);

            // 4. Award XP via GamificationEngine
            require_once 'gamification_engine.php';
            $engine = new GamificationEngine($pdo);
            $engine->awardXP($attendee['user_id'], 'challenge', ['event_id' => $attendee['event_id'], 'note' => 'Hadir di acara: ' . $attendee['title']]);

            // 5. Notify attendee
            $stmtNotif = $pdo->prepare("INSERT INTO notifications (user_id, type, message) VALUES (?, 'event_checkin', ?)");
            $checkinMsg = "Syukron! Check-in di '" . $attendee['title'] . "' berhasil. Kamu baru saja mendapatkan +100 XP! ✨🔥";
            $stmtNotif->execute([$attendee['user_id'], $checkinMsg]);

            // Real-time Notification
            RealtimeHelper::notifyUser($attendee['user_id'], 'event_checkin', $checkinMsg, ['xp' => 100]);

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Check-in sukses!', 'event_title' => $attendee['title']]);
        }
        catch (PDOException $e) {
            if ($pdo->inTransaction())
                $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'create') {
        $data = json_decode(file_get_contents("php://input"), true);
        $userId = $data['userId'] ?? null;
        $title = $data['title'] ?? '';
        $date = $data['date'] ?? '';
        $time = $data['time'] ?? '';
        $location = $data['location'] ?? '';
        $category = $data['category'] ?? 'Kajian';
        $image = $data['image'] ?? null;
        $mosqueId = $data['mosqueId'] ?? null;

        if (!$userId || !$title || !$date || !$mosqueId) {
            http_response_code(400);
            echo json_encode(['error' => 'Title, Date, Mosque, and User ID required']);
            exit;
        }

        // 1. RBAC Check
        $stmtUser = $pdo->prepare("SELECT role, managed_mosque_id FROM users WHERE id = ?");
        $stmtUser->execute([$userId]);
        $user = $stmtUser->fetch();

        if (!$user || ($user['role'] !== 'superadmin' && $user['role'] !== 'admin')) {
            http_response_code(403);
            echo json_encode(['error' => 'Permission denied: Admin only']);
            exit;
        }

        // 2. Mosque Admin Check
        if ($user['role'] === 'admin' && (int)$user['managed_mosque_id'] !== (int)$mosqueId) {
            http_response_code(403);
            echo json_encode(['error' => 'Permission denied: You can only manage your assigned mosque']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO events (title, date, time, location, category, image, mosque_id, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $date, $time, $location, $category, $image, $mosqueId, $userId]);
            $newId = $pdo->lastInsertId();

            echo json_encode(['success' => true, 'message' => 'Event created successfully!', 'id' => $newId]);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create event: ' . $e->getMessage()]);
        }
    }
    elseif ($action === 'appointScanner') {
        $data = json_decode(file_get_contents("php://input"), true);
        $adminId = $data['adminId'] ?? null; // The person appointing
        $eventId = $data['eventId'] ?? null;
        $targetUserId = $data['targetUserId'] ?? null; // The person being appointed

        if (!$adminId || !$eventId || !$targetUserId) {
            http_response_code(400);
            echo json_encode(['error' => 'Admin ID, Event ID, and Target User ID required']);
            exit;
        }

        try {
            // 1. Check if event exists and if appointment is by creator or superadmin
            $stmtEvent = $pdo->prepare("SELECT creator_id FROM events WHERE id = ?");
            $stmtEvent->execute([$eventId]);
            $event = $stmtEvent->fetch();

            if (!$event) {
                http_response_code(404);
                echo json_encode(['error' => 'Event not found']);
                exit;
            }

            $stmtAdmin = $pdo->prepare("SELECT role FROM users WHERE id = ?");
            $stmtAdmin->execute([$adminId]);
            $adminUser = $stmtAdmin->fetch();

            if ((int)$event['creator_id'] !== (int)$adminId && (!isset($adminUser['role']) || $adminUser['role'] !== 'superadmin')) {
                http_response_code(403);
                echo json_encode(['error' => 'Hanya pembuat acara yang bisa menunjuk petugas scan']);
                exit;
            }

            // 2. Check target user rank (Level 3)
            $stmtTarget = $pdo->prepare("SELECT level, username FROM users WHERE id = ?");
            $stmtTarget->execute([$targetUserId]);
            $target = $stmtTarget->fetch();

            if (!$target) {
                http_response_code(404);
                echo json_encode(['error' => 'User yang dituju tidak ditemukan']);
                exit;
            }

            if ((int)$target['level'] < 3) {
                http_response_code(400);
                echo json_encode(['error' => 'User harus minimal Level 3 untuk menjadi petugas scan.']);
                exit;
            }

            // 3. Appoint
            $stmtAppoint = $pdo->prepare("INSERT INTO event_scanners (event_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE appointed_at = NOW()");
            $stmtAppoint->execute([$eventId, $targetUserId]);

            echo json_encode(['success' => true, 'message' => "User @{$target['username']} berhasil ditunjuk sebagai petugas scan!"]);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
?>
