<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') { exit(0); }

function checkSuperadmin($pdo, $user_id)
{
    if (!$user_id) return false;
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return ($user && $user['role'] === 'superadmin');
}

// ─────────────────────────────────────────
// GET: list challenges + user progress
// ─────────────────────────────────────────
if ($method === 'GET') {
    $action   = $_GET['action']   ?? '';
    $user_id  = (int)($_GET['user_id']  ?? 0);
    $admin_id = (int)($_GET['admin_id'] ?? 0);

    if ($action === 'list') {
        try {
            $where  = [];
            $params = [];

            // Non-admin: hanya tampilkan yang aktif & belum expired
            if (!$admin_id || !checkSuperadmin($pdo, $admin_id)) {
                $where[]  = "is_active = 1";
                $where[]  = "(period_type = 'always' OR (period_type = 'seasonal' AND end_date >= CURRENT_DATE))";
            }

            $query = "SELECT * FROM challenges";
            if ($where) $query .= " WHERE " . implode(" AND ", $where);
            $query .= " ORDER BY created_at DESC";

            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $challenges = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Inject user progress
            if ($user_id) {
                $stmt = $pdo->prepare("SELECT challenge_id, current_count, is_completed FROM user_challenges WHERE user_id = ?");
                $stmt->execute([$user_id]);
                $progress = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $progressMap = [];
                foreach ($progress as $p) {
                    $progressMap[$p['challenge_id']] = $p;
                }

                foreach ($challenges as &$c) {
                    $p = $progressMap[$c['id']] ?? null;
                    $c['user_progress'] = $p ? (int)$p['current_count'] : 0;
                    $c['is_completed']  = $p ? (int)$p['is_completed']  : 0;
                }
            }

            echo json_encode($challenges);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch challenges: ' . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Unknown action']);
    }

// ─────────────────────────────────────────
// POST: create challenge (admin) OR log progress (user)
// ─────────────────────────────────────────
} elseif ($method === 'POST') {
    $data   = json_decode(file_get_contents("php://input"), true) ?? [];
    $action = $data['action'] ?? 'create';

    // ── User: catat progress manual ──────────────────────────────
    if ($action === 'log') {
        $user_id      = (int)($data['user_id']      ?? 0);
        $challenge_id = (int)($data['challenge_id'] ?? 0);

        if (!$user_id || !$challenge_id) {
            http_response_code(400);
            echo json_encode(['error' => 'user_id dan challenge_id diperlukan']);
            exit();
        }

        try {
            // Ambil data challenge
            $stmt = $pdo->prepare("SELECT id, target_count, points_reward, title, type FROM challenges WHERE id = ? AND is_active = 1");
            $stmt->execute([$challenge_id]);
            $challenge = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$challenge) {
                http_response_code(404);
                echo json_encode(['error' => 'Challenge tidak ditemukan atau tidak aktif']);
                exit();
            }

            // Cek progress user saat ini
            $stmt = $pdo->prepare("SELECT id, current_count, is_completed FROM user_challenges WHERE user_id = ? AND challenge_id = ?");
            $stmt->execute([$user_id, $challenge_id]);
            $progress = $stmt->fetch(PDO::FETCH_ASSOC);

            $targetCount  = (int)$challenge['target_count'];
            $pointsReward = (int)$challenge['points_reward'];

            if (!$progress) {
                // Entri baru
                $isCompleted = (1 >= $targetCount) ? 1 : 0;
                $stmt = $pdo->prepare("INSERT INTO user_challenges (user_id, challenge_id, current_count, is_completed) VALUES (?, ?, 1, ?)");
                $stmt->execute([$user_id, $challenge_id, $isCompleted]);
                $newCount = 1;
            } else {
                if ($progress['is_completed']) {
                    echo json_encode(['success' => false, 'message' => 'Tantangan sudah selesai!', 'already_completed' => true]);
                    exit();
                }
                $newCount    = (int)$progress['current_count'] + 1;
                $isCompleted = ($newCount >= $targetCount) ? 1 : 0;
                $stmt = $pdo->prepare("UPDATE user_challenges SET current_count = ?, is_completed = ? WHERE id = ?");
                $stmt->execute([$newCount, $isCompleted, $progress['id']]);
            }

            // Award XP jika selesai
            if ($isCompleted) {
                $stmt = $pdo->prepare("UPDATE users SET points = points + ? WHERE id = ?");
                $stmt->execute([$pointsReward, $user_id]);

                $msg = "Tantangan Selesai! 🎉 Selamat! Kamu telah menyelesaikan '{$challenge['title']}' dan mendapatkan {$pointsReward} poin bonus.";
                $stmt = $pdo->prepare("INSERT INTO notifications (user_id, type, message) VALUES (?, 'challenge', ?)");
                $stmt->execute([$user_id, $msg]);
            }

            echo json_encode([
                'success'        => true,
                'new_count'      => $newCount,
                'target'         => $targetCount,
                'is_completed'   => (bool)$isCompleted,
                'points_awarded' => $isCompleted ? $pointsReward : 0,
                'message'        => $isCompleted
                    ? "Tantangan selesai! +{$pointsReward} XP 🎉"
                    : "Progress tercatat: {$newCount}/{$targetCount}"
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        exit();
    }

    // ── Admin: create challenge ───────────────────────────────────
    $admin_id = (int)($data['admin_id'] ?? 0);
    if (!checkSuperadmin($pdo, $admin_id)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: Superadmin access required']);
        exit();
    }

    $title        = trim($data['title']       ?? '');
    $description  = trim($data['description'] ?? '');
    $target_count = (int)($data['target_count'] ?? 1);
    $points_reward = (int)($data['points_reward'] ?? $data['points'] ?? 0);
    $type         = $data['type']        ?? 'manual';   // post | checkin | donation | manual
    $period_type  = $data['period_type'] ?? 'always';   // always | seasonal
    $start_date   = $data['start_date']  ?? null;
    $end_date     = $data['end_date']    ?? null;
    $is_active    = isset($data['is_active']) ? (int)$data['is_active'] : 1;

    if (!$title) {
        http_response_code(400);
        echo json_encode(['error' => 'Judul challenge diperlukan']);
        exit();
    }

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO challenges (title, description, target_count, points_reward, type, period_type, start_date, end_date, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([$title, $description, $target_count, $points_reward, $type, $period_type, $start_date, $end_date, $is_active]);
        echo json_encode(['success' => true, 'message' => 'Challenge berhasil dibuat', 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

// ─────────────────────────────────────────
// PUT: update challenge (admin only)
// ─────────────────────────────────────────
} elseif ($method === 'PUT') {
    $data     = json_decode(file_get_contents("php://input"), true) ?? [];
    $admin_id = (int)($data['admin_id'] ?? 0);

    if (!checkSuperadmin($pdo, $admin_id)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: Superadmin access required']);
        exit();
    }

    $id           = (int)($data['id'] ?? 0);
    $title        = trim($data['title']       ?? '');
    $description  = trim($data['description'] ?? '');
    $target_count = (int)($data['target_count'] ?? 1);
    $points_reward = (int)($data['points_reward'] ?? $data['points'] ?? 0);
    $type         = $data['type']        ?? 'manual';
    $period_type  = $data['period_type'] ?? 'always';
    $start_date   = $data['start_date']  ?? null;
    $end_date     = $data['end_date']    ?? null;
    $is_active    = isset($data['is_active']) ? (int)$data['is_active'] : 1;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID challenge diperlukan']);
        exit();
    }

    try {
        $stmt = $pdo->prepare(
            "UPDATE challenges SET title=?, description=?, target_count=?, points_reward=?, type=?, period_type=?, start_date=?, end_date=?, is_active=?
             WHERE id=?"
        );
        $stmt->execute([$title, $description, $target_count, $points_reward, $type, $period_type, $start_date, $end_date, $is_active, $id]);
        echo json_encode(['success' => true, 'message' => 'Challenge berhasil diupdate']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }

// ─────────────────────────────────────────
// DELETE: hapus challenge (admin only)
// ─────────────────────────────────────────
} elseif ($method === 'DELETE') {
    $data     = json_decode(file_get_contents("php://input"), true) ?? [];
    $admin_id = (int)($data['admin_id'] ?? 0);

    if (!checkSuperadmin($pdo, $admin_id)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: Superadmin access required']);
        exit();
    }

    $id = (int)($data['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID challenge diperlukan']);
        exit();
    }

    try {
        $pdo->prepare("DELETE FROM user_challenges WHERE challenge_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM challenges WHERE id = ?")->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Challenge berhasil dihapus']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
