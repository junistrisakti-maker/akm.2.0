<?php
require_once __DIR__ . '/../../api/config.php';

$active_url = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'active_backsound_url'")->fetchColumn();

if ($active_url) {
    // Check if it already exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM backsounds WHERE url = ?");
    $stmt->execute([$active_url]);
    if ($stmt->fetchColumn() == 0) {
        $stmt = $pdo->prepare("INSERT INTO backsounds (name, url, public_id, is_active) VALUES (?, ?, ?, 1)");
        $stmt->execute(['Existing Backsound', $active_url, 'legacy']);
        echo "Backfilled active backsound: $active_url\n";
    }
    else {
        echo "Active backsound already in table.\n";
    }
}
else {
    echo "No active backsound found to backfill.\n";
}
?>
