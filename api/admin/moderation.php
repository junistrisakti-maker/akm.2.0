<?php
header('Content-Type: application/json');
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Get Requester Info
$admin_id = $_GET['admin_id'] ?? $_POST['admin_id'] ?? 0;
if ($method === 'POST') {
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
        $type = $_GET['type'] ?? 'pending';

        $query = "
            SELECT 
                r.id as review_id, 
                r.post_id, 
                r.reason, 
                r.confidence_score, 
                r.status as review_status,
                p.caption as content, 
                p.type as post_type, 
                u.username,
                (SELECT url FROM post_media WHERE post_id = p.id LIMIT 1) as media_url
            FROM content_review_queue r
            JOIN posts p ON r.post_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE r.status = ?
        ";

        $params = [$type];
        if (!$isSuper) {
            $query .= " AND u.favorite_mosque_id = ?";
            $params[] = $managedMosqueId;
        }

        $query .= " ORDER BY r.created_at DESC";

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'reviews' => $reviews]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        $reviewId = $data['reviewId'];
        $postId = $data['postId'];
        $action = $data['action'];

        // Verify ownership if not superadmin
        if (!$isSuper) {
            $check = $pdo->prepare("SELECT u.favorite_mosque_id FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?");
            $check->execute([$postId]);
            $postMosque = $check->fetchColumn();
            if ($postMosque != $managedMosqueId) {
                throw new Exception("Unauthorized: Content belongs to another node.");
            }
        }

        if ($action === 'approve') {
            $pdo->prepare("UPDATE content_review_queue SET status = 'approved' WHERE id = ?")->execute([$reviewId]);
            $pdo->prepare("UPDATE posts SET status = 'active' WHERE id = ?")->execute([$postId]);
        }
        elseif ($action === 'reject') {
            $pdo->prepare("UPDATE content_review_queue SET status = 'rejected' WHERE id = ?")->execute([$reviewId]);
            $pdo->prepare("UPDATE posts SET status = 'removed' WHERE id = ?")->execute([$postId]);
        }

        echo json_encode(['success' => true]);
    }
    catch (Exception $e) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
