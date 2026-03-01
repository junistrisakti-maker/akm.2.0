<?php
require_once __DIR__ . '/../../api/config.php';
try {
    $password = password_hash('admin123', PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE username = 'admin' AND role = 'admin'");
    $stmt->execute([$password]);
    if ($stmt->rowCount() > 0) {
        echo "Password for admin has been reset to: admin123\n";
    }
    else {
        echo "No admin user found to reset.\n";
    }
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
