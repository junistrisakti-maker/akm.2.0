<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../api/config.php';
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

echo json_encode([
    'success' => true,
    'session_id' => session_id(),
    'admin_id' => $_SESSION['admin_id'] ?? null,
    'admin_role' => $_SESSION['admin_role'] ?? null,
    'cookies' => $_COOKIE,
    'headers' => getallheaders()
]);
?>
