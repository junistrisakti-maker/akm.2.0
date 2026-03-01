<?php
require_once __DIR__ . '/../../api/config.php';
try {
    $stmt = $pdo->prepare("SELECT id, username, email, role FROM users WHERE id = ?");
    $stmt->execute([4]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        echo "ID: " . $user['id'] . "\nUsername: " . $user['username'] . "\nEmail: " . $user['email'] . "\nRole: " . $user['role'] . "\n";
    }
    else {
        echo "User ID 4 not found.\n";
    }
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
