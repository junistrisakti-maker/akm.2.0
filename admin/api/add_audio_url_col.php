<?php
require_once __DIR__ . '/../../api/config.php';
try {
    $pdo->exec("ALTER TABLE posts ADD COLUMN audio_url VARCHAR(255) DEFAULT NULL AFTER audio_name");
    echo "Column audio_url added successfully\n";
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    // Check if it already exists
    $stmt = $pdo->query("DESCRIBE posts");
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (in_array('audio_url', $cols)) {
        echo "Column audio_url already exists.\n";
    }
}
?>
