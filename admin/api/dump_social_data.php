<?php
require_once __DIR__ . '/../../api/config.php';
echo "--- USERS ---\n";
$users = $pdo->query("SELECT id, username, role FROM users")->fetchAll(PDO::FETCH_ASSOC);
print_r($users);

echo "\n--- BUDDIES ---\n";
$buddies = $pdo->query("SELECT * FROM buddies")->fetchAll(PDO::FETCH_ASSOC);
print_r($buddies);
?>
