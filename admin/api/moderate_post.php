<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../auth/check-session.php';
require_once __DIR__ . '/../../api/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit();
}

$post_id = $_POST['post_id'] ?? 0;
$action = $_POST['action'] ?? ''; // 'approve' or 'reject'

if (!$post_id || !$action) {
    echo json_encode(['success' => false, 'error' => 'Missing post_id or action']);
    exit();
}

try {
    $status = ($action === 'approve') ? 'active' : 'removed';

    $stmt = $pdo->prepare("UPDATE posts SET status = ? WHERE id = ?");
    $result = $stmt->execute([$status, $post_id]);

    if ($result) {
        echo json_encode(['success' => true, 'message' => "Post #$post_id telah " . ($action === 'approve' ? 'disetujui' : 'ditolak') . "."]);
    }
    else {
        echo json_encode(['success' => false, 'error' => 'Gagal memperbarui status post.']);
    }

}
catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
