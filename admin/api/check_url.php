<?php
require_once __DIR__ . '/../../api/config.php';
$stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'active_backsound_url'");
$url = $stmt->fetchColumn();
echo "ACTIVE_URL: [$url]\n";
?>
