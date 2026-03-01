<?php
require_once __DIR__ . '/../../api/config.php';
$stmt = $pdo->query("SELECT * FROM settings");
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
file_put_contents(__DIR__ . '/full_settings_dump.txt', print_r($results, true));
echo "Full dump written to full_settings_dump.txt\n";
?>
