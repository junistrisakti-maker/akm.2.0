<?php
header('Content-Type: application/json');
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Get Requester Info
$admin_id = $_GET['admin_id'] ?? $_POST['admin_id'] ?? 0;
if ($method === 'PUT' || $method === 'DELETE' || ($method === 'POST' && empty($_POST))) {
    $data = json_decode(file_get_contents("php://input"), true);
    $admin_id = $data['admin_id'] ?? $admin_id;
}

$stmt = $pdo->prepare("SELECT role, managed_mosque_id FROM users WHERE id = ?");
$stmt->execute([$admin_id]);
$currentUser = $stmt->fetch();

if (!$currentUser || !($currentUser['role'] === 'superadmin' || $currentUser['role'] === 'admin')) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Admin access required']);
    exit();
}

$isSuper = $currentUser['role'] === 'superadmin';
$managedMosqueId = $currentUser['managed_mosque_id'];

if ($method === 'GET') {
    try {
        $query = "
            SELECT 
                e.*, 
                m.name as mosque_name 
            FROM events e
            JOIN mosques m ON e.mosque_id = m.id
        ";

        $params = [];
        if (!$isSuper) {
            $query .= " WHERE e.mosque_id = ?";
            $params = [$managedMosqueId];
        }

        $query .= " ORDER BY e.date DESC, e.time DESC";

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'events' => $events]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';
    $eventId = $data['eventId'] ?? 0;

    if ($action === 'toggle_status') {
        try {
            // Verify ownership if not superadmin
            if (!$isSuper) {
                $check = $pdo->prepare("SELECT mosque_id FROM events WHERE id = ?");
                $check->execute([$eventId]);
                $ev = $check->fetch();
                if (!$ev || $ev['mosque_id'] != $managedMosqueId) {
                    throw new Exception("Unauthorized: Event belongs to another node.");
                }
            }

            $newStatus = $data['status'] ?? 'active';
            $stmt = $pdo->prepare("UPDATE events SET status = ? WHERE id = ?");
            $stmt->execute([$newStatus, $eventId]);
            echo json_encode(['success' => true, 'message' => 'Event status updated']);
        }
        catch (Exception $e) {
            http_response_code(403);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? 0;

    try {
        // Verify ownership if not superadmin
        if (!$isSuper) {
            $check = $pdo->prepare("SELECT mosque_id FROM events WHERE id = ?");
            $check->execute([$id]);
            $ev = $check->fetch();
            if (!$ev || $ev['mosque_id'] != $managedMosqueId) {
                throw new Exception("Unauthorized: Event belongs to another node.");
            }
        }

        $title = $data['title'] ?? '';
        $date = $data['date'] ?? '';
        $time = $data['time'] ?? '';
        $location = $data['location'] ?? '';
        $category = $data['category'] ?? '';
        $image = $data['image'] ?? '';

        $stmt = $pdo->prepare("UPDATE events SET title = ?, date = ?, time = ?, location = ?, category = ?, image = ? WHERE id = ?");
        $stmt->execute([$title, $date, $time, $location, $category, $image, $id]);
        echo json_encode(['success' => true, 'message' => 'Event updated successfully']);
    }
    catch (Exception $e) {
        http_response_code(403);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? 0;

    try {
        // Verify ownership if not superadmin
        if (!$isSuper) {
            $check = $pdo->prepare("SELECT mosque_id FROM events WHERE id = ?");
            $check->execute([$id]);
            $ev = $check->fetch();
            if (!$ev || $ev['mosque_id'] != $managedMosqueId) {
                throw new Exception("Unauthorized: Event belongs to another node.");
            }
        }

        $stmt = $pdo->prepare("DELETE FROM events WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Event deleted successfully']);
    }
    catch (Exception $e) {
        http_response_code(403);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
