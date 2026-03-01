<?php
require_once __DIR__ . '/../../api/config.php';
try {
    $stmt = $pdo->query("SELECT * FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Total Users: " . count($users) . "\n---\n";
    foreach ($users as $user) {
        unset($user['password']); // Safety
        print_r($user);
    }
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
