<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../api/config.php';
require_once __DIR__ . '/../auth/check-session.php';

$id = $_GET['id'] ?? null;
if (!$id) {
    echo json_encode(['success' => false, 'error' => 'ID tidak ditemukan.']);
    exit;
}

try {
    // Basic toggle: switch is_active between 0 and 1
    $pdo->prepare("UPDATE backsounds SET is_active = 1 - is_active WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
}
catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
