<?php
require_once __DIR__ . '/../../api/config.php';
$stmt = $pdo->query("DESCRIBE posts");
$columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
foreach ($columns as $c)
    echo "$c\n";
?>
