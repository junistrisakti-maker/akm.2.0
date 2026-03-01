<?php
require_once __DIR__ . '/../../api/config.php';

echo "--- TABLES ---\n";
$stmt = $pdo->query("SHOW TABLES");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $t) {
    if (strpos($t, 'settings') !== false || strpos($t, 'backsound') !== false) {
        echo "Found table: $t\n";
    }
}

echo "\n--- SETTINGS TABLE DATA ---\n";
if (in_array('settings', $tables)) {
    $stmt = $pdo->query("SELECT * FROM settings WHERE setting_key LIKE '%backsound%' OR setting_key LIKE '%cloudinary%'");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
}

echo "\n--- SYSTEM_SETTINGS TABLE DATA ---\n";
if (in_array('system_settings', $tables)) {
    $stmt = $pdo->query("SELECT * FROM system_settings WHERE setting_key LIKE '%backsound%' OR setting_key LIKE '%vibe%'");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
}
?>
