<?php
require_once __DIR__ . '/../../api/config.php';
$tables = ['users', 'buddies', 'check_ins', 'notifications'];
foreach ($tables as $table) {
    echo "[$table]\n";
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM $table");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "  - " . $row['Field'] . " (" . $row['Type'] . ")\n";
        }
    }
    catch (Exception $e) {
        echo "  Table not found.\n";
    }
}
?>
