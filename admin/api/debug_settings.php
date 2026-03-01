<?php
require_once __DIR__ . '/../../api/config.php';
$stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'cloudinary_%'");
$settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
file_put_contents(__DIR__ . '/settings_dump.txt', print_r($settings, true));
echo "Dump written to settings_dump.txt\n";
?>
