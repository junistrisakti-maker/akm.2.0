<?php
require_once __DIR__ . '/../../api/config.php';
$stmt = $pdo->query("SHOW TABLES LIKE 'backsounds'");
if ($stmt->rowCount() > 0) {
    echo "EXISTS\n";
    $stmt = $pdo->query("DESCRIBE backsounds");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
}
else {
    echo "MISSING\n";
}
?>
