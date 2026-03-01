<?php
header('Content-Type: application/json');
require 'config.php';

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['userId'] ?? null;
    $status = $_GET['status'] ?? null;

    try {
        $sql = "SELECT r.*, m.name as mosque_name, u.username 
                FROM mosque_admin_requests r
                JOIN mosques m ON r.mosque_id = m.id
                JOIN users u ON r.user_id = u.id
                WHERE 1=1";
        $params = [];

        if ($userId) {
            $sql .= " AND r.user_id = ?";
            $params[] = $userId;
        }
        if ($status) {
            $sql .= " AND r.status = ?";
            $params[] = $status;
        }

        $sql .= " ORDER BY r.created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'requests' => $requests]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    if ($action === 'submit') {
        $userId = $data['userId'] ?? null;
        $mosqueId = $data['mosqueId'] ?? null;
        $documentUrl = $data['documentUrl'] ?? '';

        if (!$userId || !$mosqueId) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID and Mosque ID required']);
            exit;
        }

        // Check if already has a pending request
        $stmtCheck = $pdo->prepare("SELECT id FROM mosque_admin_requests WHERE user_id = ? AND status = 'pending'");
        $stmtCheck->execute([$userId]);
        if ($stmtCheck->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'You already have a pending request. Please wait for approval.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO mosque_admin_requests (user_id, mosque_id, document_url) VALUES (?, ?, ?)");
            $stmt->execute([$userId, $mosqueId, $documentUrl]);
            echo json_encode(['success' => true, 'message' => 'Request submitted successfully!']);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to submit request: ' . $e->getMessage()]);
        }
    }
    elseif ($action === 'review') {
        $requestId = $data['requestId'] ?? null;
        $adminId = $data['adminId'] ?? null;
        $status = $data['status'] ?? null; // 'approved' or 'rejected'
        $note = $data['note'] ?? '';

        if (!$requestId || !$adminId || !$status) {
            http_response_code(400);
            echo json_encode(['error' => 'Request ID, Admin ID, and Status required']);
            exit;
        }

        // RBAC Check for reviewer
        $stmtAdmin = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmtAdmin->execute([$adminId]);
        $admin = $stmtAdmin->fetch();

        if (!$admin || $admin['role'] !== 'superadmin') {
            http_response_code(403);
            echo json_encode(['error' => 'Only Superadmins can review requests']);
            exit;
        }

        try {
            $pdo->beginTransaction();

            // Update request status
            $stmt = $pdo->prepare("UPDATE mosque_admin_requests SET status = ?, admin_note = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$status, $note, $requestId]);

            // If approved, update user role and managed_mosque_id
            if ($status === 'approved') {
                $stmtGetReq = $pdo->prepare("SELECT user_id, mosque_id FROM mosque_admin_requests WHERE id = ?");
                $stmtGetReq->execute([$requestId]);
                $req = $stmtGetReq->fetch();

                if ($req) {
                    $stmtUser = $pdo->prepare("UPDATE users SET role = 'admin', managed_mosque_id = ? WHERE id = ?");
                    $stmtUser->execute([$req['mosque_id'], $req['user_id']]);
                }
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Request ' . $status . ' successfully!']);
        }
        catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to review request: ' . $e->getMessage()]);
        }
    }
}
