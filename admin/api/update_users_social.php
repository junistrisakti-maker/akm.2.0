<?php
require_once __DIR__ . '/../../api/config.php';
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    echo "Column last_seen added.\n";
}
catch (Exception $e) {
    echo "last_seen already exists or error: " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE users ADD COLUMN current_activity VARCHAR(100) DEFAULT NULL");
    echo "Column current_activity added.\n";
}
catch (Exception $e) {
    echo "current_activity already exists or error: " . $e->getMessage() . "\n";
}
?>
