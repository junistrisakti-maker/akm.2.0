<?php
require_once __DIR__ . '/../../api/config.php';
$stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'cloudinary_%'");
print_r($stmt->fetchAll(PDO::FETCH_KEY_PAIR));
?>
