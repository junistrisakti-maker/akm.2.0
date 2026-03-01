<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

require_once 'config.php';

try {
    // 1. Get the primary active one for backward compatibility
    $stmt = $pdo->query("SELECT url FROM backsounds WHERE is_active = 1 LIMIT 1");
    $active_url = $stmt->fetchColumn();

    // 2. Get all backsounds for the full list
    $stmt = $pdo->query("SELECT id, name, url, is_active FROM backsounds ORDER BY is_active DESC, created_at DESC");
    $list = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'url' => $active_url ?: null,
        'name' => '✨ Vibe dari Admin (Terbaru)',
        'list' => $list
    ]);
}
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
