<?php
header('Content-Type: application/json');
require 'config.php';

// GET user profile by username or ID
// ?u=username
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $username = isset($_GET['u']) ? $_GET['u'] : 'akm_official'; // Default for demo

    try {
        $stmt = $pdo->prepare("SELECT id, username, email, avatar, points, streak, badges FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Badges might be null
            $user['badges'] = json_decode($user['badges']) ?: [];
            echo json_encode($user);
        }
        else {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
        }
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
