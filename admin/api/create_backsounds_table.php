<?php
require_once __DIR__ . '/../../api/config.php';
try {
    $sql = "CREATE TABLE IF NOT EXISTS backsounds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL,
        public_id VARCHAR(100) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active TINYINT(1) DEFAULT 0
    )";
    $pdo->exec($sql);
    echo "Table backsounds created successfully.\n";
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
