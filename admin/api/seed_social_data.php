<?php
require_once __DIR__ . '/../../api/config.php';

// 1. Create a dummy user
try {
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password, role, points, streak) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute(['Fitra GenZ', 'fitra@akm.com', password_hash('password123', PASSWORD_DEFAULT), 'user', 150, 5]);
    $buddyId = $pdo->lastInsertId();
    echo "Sample user created ID: $buddyId\n";
}
catch (Exception $e) {
    // If user exists, get their ID
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = 'Fitra GenZ'");
    $stmt->execute();
    $buddyId = $stmt->fetchColumn();
    echo "Sample user already exists ID: $buddyId\n";
}

// 2. Create another dummy user
try {
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password, role, points, streak) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute(['Ukhti Sarah', 'sarah@akm.com', password_hash('password123', PASSWORD_DEFAULT), 'user', 240, 12]);
    $buddyId2 = $pdo->lastInsertId();
    echo "Sample user 2 created ID: $buddyId2\n";
}
catch (Exception $e) {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = 'Ukhti Sarah'");
    $stmt->execute();
    $buddyId2 = $stmt->fetchColumn();
    echo "Sample user 2 already exists ID: $buddyId2\n";
}

// 3. Link them to user ID 1 (Admin)
$adminId = 1;
$buddiesToLink = [$buddyId, $buddyId2];

foreach ($buddiesToLink as $bid) {
    try {
        $stmt = $pdo->prepare("INSERT INTO buddies (user_id, buddy_id, status) VALUES (?, ?, 'accepted')");
        $stmt->execute([$adminId, $bid]);
        echo "Link Admin-$bid created.\n";
    }
    catch (Exception $e) {
        echo "Link Admin-$bid already exists or error.\n";
    }
}

// 4. Give them some activity
try {
    $pdo->exec("UPDATE users SET current_activity = 'Reading Quran', last_seen = NOW() WHERE id = $buddyId");
    $pdo->exec("UPDATE users SET current_activity = 'At Masjid Al-Ikhlas', last_seen = NOW() WHERE id = $buddyId2");
    echo "Activities updated.\n";
}
catch (Exception $e) {
    echo "Activity update failed: " . $e->getMessage() . "\n";
}
?>
