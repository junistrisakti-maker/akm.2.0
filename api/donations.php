<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle OPTIONS request (preflight) for CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require 'config.php';

// GET donations (Summary for Tracker)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get total amount
        $totalStmt = $pdo->query("SELECT SUM(amount) FROM donations WHERE status = 'active'");
        $total = (float)$totalStmt->fetchColumn();

        // Get recent donations
        $recentStmt = $pdo->query("
            SELECT d.*, u.username, u.avatar
            FROM donations d
            JOIN users u ON d.user_id = u.id
            WHERE d.status = 'active'
            ORDER BY d.created_at DESC
            LIMIT 10
        ");
        $recent = $recentStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'total' => $total,
            'target' => 10000000, // Fixed target for now
            'recent' => $recent
        ]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// POST donation
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $userId = $data['user_id'] ?? null;
    $amount = $data['amount'] ?? null;
    $message = $data['message'] ?? '';
    // Use 0 as default if is_anonymous is not provided
    $is_anonymous = isset($data['is_anonymous']) ? (int)$data['is_anonymous'] : 0;

    if (!$userId || !$amount) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID and amount are required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO donations (user_id, donor_name, amount, message, is_anonymous, created_at, status) 
            VALUES (?, 'Hamba Allah', ?, ?, ?, NOW(), 'active')
        ");
        $stmt->execute([$userId, (float)$amount, $message, $is_anonymous]);

        $donationId = $pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'donation_id' => $donationId,
            'message' => 'Donation created successfully'
        ]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}