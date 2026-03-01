<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require 'config.php';

// GET all posts
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $filterUserId = $_GET['userId'] ?? null;
    $currentUserId = $_GET['currentUserId'] ?? null;

    try {
        $sql = "SELECT p.*, u.username, u.avatar,
                (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ? AND interaction_type = 'like') as is_liked,
                (SELECT COUNT(*) FROM post_interactions WHERE post_id = p.id AND user_id = ? AND interaction_type = 'save') as is_saved
                FROM posts p 
                JOIN users u ON p.user_id = u.id
                WHERE p.status = 'active'";

        $params = [$currentUserId, $currentUserId];
        if ($filterUserId) {
            $sql .= " AND p.user_id = ?";
            $params[] = $filterUserId;
        }

        $sql .= " ORDER BY p.created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // OPTIMIZATION: Get all media files for all fetched posts in ONE query (Avoid N+1)
        $formattedPosts = [];
        if (!empty($posts)) {
            $postIds = array_column($posts, 'id');
            $placeholders = implode(',', array_fill(0, count($postIds), '?'));

            $mediaStmt = $pdo->prepare("
                SELECT post_id, media_url as url, media_type as type, sort_order 
                FROM post_media 
                WHERE post_id IN ($placeholders)
                ORDER BY post_id, sort_order ASC
            ");
            $mediaStmt->execute($postIds);
            $allMedia = $mediaStmt->fetchAll(PDO::FETCH_GROUP | PDO::FETCH_ASSOC);

            // Format for frontend
            $formattedPosts = array_map(function ($post) use ($allMedia) {
                $mediaFiles = $allMedia[$post['id']] ?? [];

                return [
                'id' => $post['id'],
                'user' => $post['username'],
                'avatar' => $post['avatar'],
                'caption' => $post['caption'],
                'tags' => $post['tags'],
                'type' => $post['type'],
                'bgColor' => $post['bg_color'],
                'url' => $post['url'],
                'media_files' => $mediaFiles,
                'likes' => (int)$post['likes'],
                'comments' => (int)$post['comments'],
                'shares' => (int)$post['shares'],
                'saves' => (int)$post['saves'],
                'isLiked' => (bool)$post['is_liked'],
                'isSaved' => (bool)$post['is_saved'],
                'audioName' => $post['audio_name'],
                'audioUrl' => $post['audio_url'],
                'rating' => $post['rating'] > 0 ? $post['rating'] : null,
                'reviewCount' => $post['review_count'],
                'locationName' => $post['location_name']
                ];
            }, $posts);
        }

        echo json_encode($formattedPosts);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
