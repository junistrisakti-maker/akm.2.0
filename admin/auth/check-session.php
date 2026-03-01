<?php
require_once __DIR__ . '/../../api/config.php';
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Ensure session is set and role is administrative
if (!isset($_SESSION['admin_id']) || !in_array($_SESSION['admin_role'], ['admin', 'superadmin'])) {
    // Detect if this is an API request
    $isApi = strpos($_SERVER['REQUEST_URI'], '/api/') !== false ||
        (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest');

    if ($isApi) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized. Please login again.']);
        exit();
    }

    header("Location: /AKM.2.0/admin/auth/login.php");
    exit();
}
?>
