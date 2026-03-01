<?php
header('Content-Type: application/json');
require 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // REGISTER
    if ($action === 'register') {
        $username = $data['username'] ?? '';
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        if (!$username || !$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'All fields are required']);
            exit;
        }

        // Hash password
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        try {
            $stmt = $pdo->prepare("INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)");
            // default avatar
            $avatar = "https://ui-avatars.com/api/?name=" . urlencode($username) . "&background=random";

            $stmt->execute([$username, $email, $hashed_password, $avatar]);

            echo json_encode(['message' => 'User registered successfully']);
        }
        catch (PDOException $e) {
            http_response_code(400); // Bad Request (likely duplicate entry)
            echo json_encode(['error' => 'Username or Email already exists']);
        }
    }

    // LOGIN
    elseif ($action === 'login') {
        $username = $data['username'] ?? ''; // or email
        $password = $data['password'] ?? '';

        if (!$username || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Username and Password required']);
            exit;
        }

        try {
            // Find user by username OR email
            $stmt = $pdo->prepare("
                SELECT u.*, m.name as mosque_name 
                FROM users u 
                LEFT JOIN mosques m ON u.managed_mosque_id = m.id 
                WHERE u.username = ? OR u.email = ?
            ");
            $stmt->execute([$username, $username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($password, $user['password'])) {
                $lastLogin = $user['last_login'];
                $now = new DateTime();
                $todayStr = $now->format('Y-m-d');
                $newStreak = (int)$user['streak'];
                $newPoints = (int)$user['points'];

                if ($lastLogin) {
                    $lastLoginDate = new DateTime($lastLogin);
                    $lastDateStr = $lastLoginDate->format('Y-m-d');

                    $diff = $now->diff($lastLoginDate)->days;

                    if ($lastDateStr !== $todayStr) {
                        if ($diff === 1) {
                            // Consecutive day
                            $newStreak++;
                            $newPoints += 10; // Daily login bonus
                        }
                        elseif ($diff > 1) {
                            // Missed day
                            $newStreak = 1;
                        }
                        else {
                        // Same day (already handled by date comparison, but just in case)
                        }
                    }
                }
                else {
                    // First login ever
                    $newStreak = 1;
                    $newPoints += 50; // New member bonus!
                }

                // Update user in DB
                $stmtUpdate = $pdo->prepare("UPDATE users SET last_login = NOW(), streak = ?, points = ? WHERE id = ?");
                $stmtUpdate->execute([$newStreak, $newPoints, $user['id']]);

                // Update local user object for response
                $user['streak'] = $newStreak;
                $user['points'] = $newPoints;

                // Check for Badge Eligibility
                require_once 'gamification_engine.php';
                $engine = new GamificationEngine($pdo);
                $engine->checkBadgeEligibility($user['id']);

                // Success! Return user info (excluding password)
                unset($user['password']);

                // Fetch badges from the new system
                $stmtBadges = $pdo->prepare("SELECT b.name FROM badges b JOIN user_badges ub ON b.id = ub.badge_id WHERE ub.user_id = ?");
                $stmtBadges->execute([$user['id']]);
                $user['badges'] = $stmtBadges->fetchAll(PDO::FETCH_COLUMN);

                echo json_encode(['message' => 'Login successful', 'user' => $user]);
            }
            else {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
            }
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
    }
}
