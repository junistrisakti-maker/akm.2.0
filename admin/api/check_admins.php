<?php
require_once __DIR__ . '/../../api/config.php';
try {
    $stmt = $pdo->query("SELECT id, username, email, role FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'users' => $users]);
}
catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
