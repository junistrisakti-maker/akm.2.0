<?php
require_once __DIR__ . '/../../api/config.php';
$tables = ['users', 'buddies', 'check_ins', 'notifications'];
foreach ($tables as $table) {
    echo "--- Table: $table ---\n";
    try {
        $stmt = $pdo->query("DESCRIBE $table");
        print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    catch (Exception $e) {
        echo "Error or table not found.\n";
    }
}
?>
