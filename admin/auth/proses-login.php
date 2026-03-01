<?php
require_once __DIR__ . '/../../api/config.php';
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        $_SESSION['error'] = "Username dan password wajib diisi.";
        header("Location: login.php");
        exit();
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE (username = ? OR email = ?) AND role IN ('admin', 'superadmin') LIMIT 1");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            // Login sukses
            $_SESSION['admin_id'] = $user['id'];
            $_SESSION['admin_username'] = $user['username'];
            $_SESSION['admin_role'] = $user['role'];

            header("Location: ../dashboard.php");
            exit();
        }
        else {
            $_SESSION['error'] = "Username atau password salah (atau Anda bukan admin).";
            header("Location: login.php");
            exit();
        }
    }
    catch (PDOException $e) {
        $_SESSION['error'] = "Database error: " . $e->getMessage();
        header("Location: login.php");
        exit();
    }
}
else {
    header("Location: login.php");
    exit();
}
?>
