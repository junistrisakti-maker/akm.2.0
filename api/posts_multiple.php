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

class PostsManager
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function createPostWithMultipleMedia($userId, $caption, $mediaFiles, $location = null, $tags = null, $audioName = null, $audioUrl = null)
    {
        try {
            $this->pdo->beginTransaction();

            // Create main post
            $stmt = $this->pdo->prepare("
                INSERT INTO posts (user_id, type, caption, url, location_name, tags, audio_name, audio_url, status, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
            ");

            $primaryType = $mediaFiles[0]['type']; // Use first file as primary type
            $primaryUrl = $mediaFiles[0]['url'];

            $stmt->execute([
                $userId,
                $primaryType,
                $caption,
                $primaryUrl,
                $location,
                $tags,
                $audioName,
                $audioUrl
            ]);

            $postId = $this->pdo->lastInsertId();

            // Store additional media files in post_media table
            $mediaStmt = $this->pdo->prepare("
                INSERT INTO post_media (post_id, media_url, media_type, file_size, original_name, sort_order) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            foreach ($mediaFiles as $index => $media) {
                $mediaStmt->execute([
                    $postId,
                    $media['url'],
                    $media['type'],
                    $media['size'],
                    $media['original_name'],
                    $index + 1
                ]);
            }

            $this->pdo->commit();

            // Track Challenge Progress
            require_once 'challenge_helper.php';
            updateChallengeProgress($this->pdo, $userId, 'post');

            return [
                'post_id' => $postId,
                'message' => 'Post created successfully with multiple media',
                'media_count' => count($mediaFiles)
            ];

        }
        catch (Exception $e) {
            $this->pdo->rollback();
            throw $e;
        }
    }

    public function getPostWithMedia($postId)
    {
        $stmt = $this->pdo->prepare("
            SELECT p.*, u.username, u.profile_image,
                   GROUP_CONCAT(
                       CONCAT(pm.media_url, '|', pm.media_type, '|', pm.sort_order) 
                       ORDER BY pm.sort_order
                       SEPARATOR ';;'
                   ) as media_files
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN post_media pm ON p.id = pm.post_id
            WHERE p.id = ?
            GROUP BY p.id
        ");

        $stmt->execute([$postId]);
        $post = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($post && $post['media_files']) {
            $mediaFiles = [];
            $files = explode(';;', $post['media_files']);

            foreach ($files as $file) {
                $parts = explode('|', $file);
                if (count($parts) >= 3) {
                    $mediaFiles[] = [
                        'url' => $parts[0],
                        'type' => $parts[1],
                        'sort_order' => $parts[2]
                    ];
                }
            }

            $post['media_files'] = $mediaFiles;
        }

        return $post;
    }
}

// Handle the request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);

        // Debug log
        error_log("posts_multiple.php received: " . print_r($data, true));

        $userId = $data['userId'] ?? null;
        $caption = $data['caption'] ?? '';
        $mediaFiles = $data['mediaFiles'] ?? [];
        $location = $data['location'] ?? null;
        $tags = $data['tags'] ?? null;
        $audioName = $data['audioName'] ?? null;
        $audioUrl = $data['audioUrl'] ?? null;

        if (!$userId || empty($mediaFiles)) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID and at least one media file are required']);
            exit;
        }

        $postsManager = new PostsManager($pdo);
        $result = $postsManager->createPostWithMultipleMedia($userId, $caption, $mediaFiles, $location, $tags, $audioName, $audioUrl);

        error_log("Post created successfully: " . print_r($result, true));

        echo json_encode([
            'success' => true,
            'data' => $result
        ]);

    }
    catch (PDOException $e) {
        error_log("Database error in posts_multiple.php: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
    catch (Exception $e) {
        error_log("General error in posts_multiple.php: " . $e->getMessage());
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get post with media
    $postId = $_GET['id'] ?? null;

    if (!$postId) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        exit;
    }

    try {
        $postsManager = new PostsManager($pdo);
        $post = $postsManager->getPostWithMedia($postId);

        if (!$post) {
            http_response_code(404);
            echo json_encode(['error' => 'Post not found']);
            exit;
        }

        echo json_encode([
            'success' => true,
            'data' => $post
        ]);

    }
    catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
