<?php
require_once __DIR__ . '/../../api/config.php';
$stmt = $pdo->query("SELECT * FROM backsounds");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
