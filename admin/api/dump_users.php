<?php
require_once __DIR__ . '/../../api/config.php';
try {
    $stmt = $pdo->query("SELECT id, username, email, role FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($users as $user) {
        echo "ID: " . $user['id'] . " | Username: " . $user['username'] . " | Email: " . $user['email'] . " | Role: " . $user['role'] . "\n";
    }
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
