<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = $_GET['action'] ?? '';
    $masjid_id = $_GET['masjid_id'] ?? 0;

    if ($action === 'list' && $masjid_id) {
        try {
            $stmt = $pdo->prepare("
                SELECT r.*, u.username, u.avatar 
                FROM masjid_reviews r 
                JOIN users u ON r.user_id = u.id 
                WHERE r.masjid_id = ? 
                ORDER BY r.created_at DESC
            ");
            $stmt->execute([$masjid_id]);
            $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($reviews);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch reviews: ' . $e->getMessage()]);
        }
    }
    else {
        echo json_encode(['error' => 'Invalid action or missing masjid_id']);
    }
}
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    if ($action === 'create') {
        $masjid_id = $data['masjid_id'] ?? 0;
        $user_id = $data['user_id'] ?? 0;
        $rating = $data['rating'] ?? 0;
        $comment = $data['comment'] ?? '';

        if (!$masjid_id || !$user_id || !$rating) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit();
        }

        try {
            // Check if user already reviewed this mosque
            $check = $pdo->prepare("SELECT id FROM masjid_reviews WHERE masjid_id = ? AND user_id = ?");
            $check->execute([$masjid_id, $user_id]);
            if ($check->fetch()) {
                http_response_code(409);
                echo json_encode(['error' => 'Anda sudah memberikan ulasan untuk masjid ini. Gunakan fitur edit untuk mengubah ulasan.']);
                exit();
            }

            $stmt = $pdo->prepare("INSERT INTO masjid_reviews (masjid_id, user_id, rating, comment) VALUES (?, ?, ?, ?)");
            $stmt->execute([$masjid_id, $user_id, $rating, $comment]);

            // Also update masjid aggregate points
            $stmt = $pdo->prepare("UPDATE mosques SET points = points + 5 WHERE id = ?");
            $stmt->execute([$masjid_id]);

            echo json_encode(['message' => 'Review submitted successfully', 'id' => $pdo->lastInsertId()]);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to submit review: ' . $e->getMessage()]);
        }
    }
    elseif ($action === 'update') {
        $review_id = $data['review_id'] ?? 0;
        $user_id = $data['user_id'] ?? 0;
        $rating = $data['rating'] ?? 0;
        $comment = $data['comment'] ?? '';

        if (!$review_id || !$user_id || !$rating) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit();
        }

        try {
            // Verify ownership
            $check = $pdo->prepare("SELECT id FROM masjid_reviews WHERE id = ? AND user_id = ?");
            $check->execute([$review_id, $user_id]);
            if (!$check->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Anda tidak memiliki izin untuk mengedit ulasan ini.']);
                exit();
            }

            $stmt = $pdo->prepare("UPDATE masjid_reviews SET rating = ?, comment = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$rating, $comment, $review_id, $user_id]);

            echo json_encode(['message' => 'Ulasan berhasil diperbarui']);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update review: ' . $e->getMessage()]);
        }
    }
}
?>
