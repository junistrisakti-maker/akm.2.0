<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'list') {
        try {
            // Filter out expired circles
            $stmt = $pdo->query("
                SELECT * FROM circles 
                WHERE status = 'active' 
                AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
                ORDER BY created_at DESC
            ");
            $circles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($circles);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'details') {
        $id = $_GET['id'] ?? 0;
        try {
            $stmt = $pdo->prepare("SELECT * FROM circles WHERE id = ?");
            $stmt->execute([$id]);
            $circle = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$circle) {
                http_response_code(404);
                echo json_encode(['error' => 'Circle not found']);
                exit;
            }

            // Get KPIs
            $stmt = $pdo->prepare("SELECT * FROM circle_kpis WHERE circle_id = ?");
            $stmt->execute([$id]);
            $kpis = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get Progress (aggregated)
            $stmt = $pdo->prepare("
                SELECT k.id as kpi_id, k.kpi_name, k.target_value, k.unit, SUM(p.value) as current_value
                FROM circle_kpis k
                LEFT JOIN circle_progress p ON k.id = p.kpi_id
                WHERE k.circle_id = ?
                GROUP BY k.id
            ");
            $stmt->execute([$id]);
            $progress = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Check membership if user_id is provided
            $user_id = $_GET['user_id'] ?? 0;
            $is_member = false;
            if ($user_id) {
                $stmt = $pdo->prepare("SELECT 1 FROM circle_members WHERE circle_id = ? AND user_id = ?");
                $stmt->execute([$id, $user_id]);
                $is_member = (bool)$stmt->fetchColumn();
            }

            // Get Top 5 Leaderboard
            $stmt = $pdo->prepare("
                SELECT u.id, u.username, u.name, u.avatar, SUM(p.value) as total_contribution
                FROM circle_members m
                JOIN users u ON m.user_id = u.id
                LEFT JOIN circle_progress p ON m.circle_id = p.circle_id AND m.user_id = p.user_id
                WHERE m.circle_id = ?
                GROUP BY u.id
                ORDER BY total_contribution DESC
                LIMIT 5
            ");
            $stmt->execute([$id]);
            $leaderboard = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'circle' => $circle,
                'kpis' => $kpis,
                'progress' => $progress,
                'is_member' => $is_member,
                'leaderboard' => $leaderboard
            ]);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'members') {
        $id = $_GET['id'] ?? 0;
        $page = $_GET['page'] ?? 1;
        $limit = 10;
        $offset = ($page - 1) * $limit;

        try {
            $stmt = $pdo->prepare("
                SELECT u.id, u.username, u.name, u.avatar, SUM(IFNULL(p.value, 0)) as total_contribution
                FROM circle_members m
                JOIN users u ON m.user_id = u.id
                LEFT JOIN circle_progress p ON m.circle_id = p.circle_id AND m.user_id = p.user_id
                WHERE m.circle_id = ?
                GROUP BY u.id
                ORDER BY total_contribution DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->bindValue(1, $id, PDO::PARAM_INT);
            $stmt->bindValue(2, $limit, PDO::PARAM_INT);
            $stmt->bindValue(3, $offset, PDO::PARAM_INT);
            $stmt->execute();
            $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($members);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}

elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    if ($action === 'create') {
        $name = $data['name'] ?? '';
        $user_id = $data['user_id'] ?? 0;
        $category = $data['category'] ?? 'Challenge';
        $is_temporary = $data['is_temporary'] ?? false;
        $duration_days = $data['duration_days'] ?? 0;

        $invite_code = substr(str_shuffle("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"), 0, 6);
        $slug = strtolower(str_replace(' ', '-', $name)) . '-' . rand(1000, 9999);
        $expires_at = $is_temporary ? date('Y-m-d H:i:s', strtotime("+$duration_days days")) : null;

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("
                INSERT INTO circles (name, category, created_by, invite_code, slug, is_temporary, expires_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$name, $category, $user_id, $invite_code, $slug, $is_temporary, $expires_at]);
            $circle_id = $pdo->lastInsertId();

            // Auto join creator as Admin
            $stmt = $pdo->prepare("INSERT INTO circle_members (circle_id, user_id, role) VALUES (?, ?, 'admin')");
            $stmt->execute([$circle_id, $user_id]);

            // Add KPI if provided
            if (!empty($data['kpi_name'])) {
                $stmt = $pdo->prepare("INSERT INTO circle_kpis (circle_id, kpi_name, unit, target_value) VALUES (?, ?, ?, ?)");
                $stmt->execute([$circle_id, $data['kpi_name'], $data['unit'] ?? 'kali', $data['target_value'] ?? 100]);
            }

            $pdo->commit();
            echo json_encode(['message' => 'Circle created!', 'id' => $circle_id, 'invite_code' => $invite_code]);
        }
        catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'join') {
        $circle_id = $data['circle_id'] ?? 0;
        $user_id = $data['user_id'] ?? 0;
        $invite_code = $data['invite_code'] ?? null;

        try {
            if ($invite_code) {
                $stmt = $pdo->prepare("SELECT id FROM circles WHERE invite_code = ?");
                $stmt->execute([$invite_code]);
                $circle = $stmt->fetch();
                if ($circle)
                    $circle_id = $circle['id'];
                else
                    throw new Exception("Invalid invite code");
            }

            $stmt = $pdo->prepare("INSERT INTO circle_members (circle_id, user_id) VALUES (?, ?)");
            $stmt->execute([$circle_id, $user_id]);

            // Update member count
            $stmt = $pdo->prepare("UPDATE circles SET member_count = member_count + 1 WHERE id = ?");
            $stmt->execute([$circle_id]);

            echo json_encode(['message' => 'Joined successfully!']);
        }
        catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'log_progress') {
        $circle_id = $data['circle_id'] ?? 0;
        $user_id = $data['user_id'] ?? 0;
        $kpi_id = $data['kpi_id'] ?? 0;
        $value = $data['value'] ?? 0;

        try {
            $stmt = $pdo->prepare("INSERT INTO circle_progress (circle_id, user_id, kpi_id, value) VALUES (?, ?, ?, ?)");
            $stmt->execute([$circle_id, $user_id, $kpi_id, $value]);
            echo json_encode(['message' => 'Progress logged!']);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    elseif ($action === 'reward_top_3') {
        $circle_id = $data['circle_id'] ?? 0;

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("SELECT is_rewarded FROM circles WHERE id = ?");
            $stmt->execute([$circle_id]);
            $circle = $stmt->fetch();

            if (!$circle || $circle['is_rewarded']) {
                throw new Exception("Circle not found or already rewarded");
            }

            $stmt = $pdo->prepare("
                SELECT user_id, SUM(value) as total
                FROM circle_progress
                WHERE circle_id = ?
                GROUP BY user_id
                ORDER BY total DESC
                LIMIT 3
            ");
            $stmt->execute([$circle_id]);
            $winners = $stmt->fetchAll();

            $rewards = [500, 300, 150];
            foreach ($winners as $index => $winner) {
                if (isset($rewards[$index])) {
                    $points = $rewards[$index];
                    $stmt = $pdo->prepare("UPDATE users SET points = points + ? WHERE id = ?");
                    $stmt->execute([$points, $winner['user_id']]);
                }
            }

            $stmt = $pdo->prepare("UPDATE circles SET is_rewarded = TRUE WHERE id = ?");
            $stmt->execute([$circle_id]);

            $pdo->commit();
            echo json_encode(['message' => 'Rewards distributed successfully!']);
        }
        catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
?>
