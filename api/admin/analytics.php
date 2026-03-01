<?php
header('Content-Type: application/json');
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $mosqueId = $_GET['mosqueId'] ?? '';
        $whereUser = "";
        $wherePost = "";
        $whereQueue = "";
        $params = [];

        if (!empty($mosqueId)) {
            $whereUser = " WHERE favorite_mosque_id = ?";
            $wherePost = " WHERE u.favorite_mosque_id = ?";
            $whereQueue = " WHERE u.favorite_mosque_id = ?";
            $params = [$mosqueId];
        }

        // 1. User Stats
        $stmtTotalUsers = $pdo->prepare("SELECT COUNT(*) FROM users" . $whereUser);
        $stmtTotalUsers->execute($params);
        $totalUsers = $stmtTotalUsers->fetchColumn();

        $stmtNewUsersToday = $pdo->prepare("SELECT COUNT(*) FROM users WHERE created_at >= CURDATE()" . (!empty($whereUser) ? " AND favorite_mosque_id = ?" : ""));
        $stmtNewUsersToday->execute($params);
        $newUsersToday = $stmtNewUsersToday->fetchColumn();

        // 2. Post Stats
        $stmtTotalPosts = $pdo->prepare("SELECT COUNT(*) FROM posts p JOIN users u ON p.user_id = u.id" . $wherePost . (empty($wherePost) ? " WHERE p.status = 'active'" : " AND p.status = 'active'"));
        $stmtTotalPosts->execute($params);
        $totalPosts = $stmtTotalPosts->fetchColumn();

        $stmtPostsToday = $pdo->prepare("SELECT COUNT(*) FROM posts p JOIN users u ON p.user_id = u.id WHERE p.created_at >= CURDATE()" . (!empty($wherePost) ? " AND u.favorite_mosque_id = ?" : ""));
        $stmtPostsToday->execute($params);
        $postsToday = $stmtPostsToday->fetchColumn();

        // 3. Activity Trends (Last 7 days)
        $trends = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $stmtTrend = $pdo->prepare("SELECT COUNT(*) FROM posts p JOIN users u ON p.user_id = u.id WHERE DATE(p.created_at) = ?" . (!empty($wherePost) ? " AND u.favorite_mosque_id = ?" : ""));
            $trendParams = array_merge([$date], $params);
            $stmtTrend->execute($trendParams);

            $trends[] = [
                'name' => date('D', strtotime($date)),
                'posts' => (int)$stmtTrend->fetchColumn()
            ];
        }

        // 4. Moderation Stats
        $stmtPending = $pdo->prepare("SELECT COUNT(*) FROM content_review_queue q JOIN posts p ON q.post_id = p.id JOIN users u ON p.user_id = u.id WHERE q.status = 'pending'" . (!empty($whereQueue) ? " AND u.favorite_mosque_id = ?" : ""));
        $stmtPending->execute($params);
        $pendingReviews = $stmtPending->fetchColumn();

        echo json_encode([
            'success' => true,
            'summary' => [
                'totalUsers' => (int)$totalUsers,
                'newUsersToday' => (int)$newUsersToday,
                'totalPosts' => (int)$totalPosts,
                'postsToday' => (int)$postsToday,
                'pendingReviews' => (int)$pendingReviews
            ],
            'trends' => $trends
        ]);

    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
