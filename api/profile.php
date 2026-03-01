<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $action = $_GET['action'] ?? '';

    if ($action === 'updateAvatar') {
        $data = json_decode(file_get_contents("php://input"), true);
        $userId = $data['userId'] ?? 0;
        $avatarUrl = $data['avatarUrl'] ?? '';

        if (!$userId || !$avatarUrl) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID and Avatar URL are required']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
            $stmt->execute([$avatarUrl, $userId]);

            echo json_encode(['message' => 'Profile picture updated successfully', 'avatar' => $avatarUrl]);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
?>
