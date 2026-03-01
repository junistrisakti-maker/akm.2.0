<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../api/config.php';
require_once __DIR__ . '/../auth/check-session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$id = $_POST['id'] ?? null;
$name = $_POST['name'] ?? null;

if (!$id || !$name) {
    echo json_encode(['success' => false, 'error' => 'ID dan Nama wajib diisi.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE backsounds SET name = ? WHERE id = ?");
    $stmt->execute([$name, $id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Nama vibe berhasil diperbarui.']);
    }
    else {
        echo json_encode(['success' => true, 'message' => 'Tidak ada perubahan.']);
    }
}
catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Gagal memperbarui database: ' . $e->getMessage()]);
}
?>
