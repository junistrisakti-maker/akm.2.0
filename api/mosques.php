<?php
header('Content-Type: application/json');
require 'config.php';

$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? null;
$q = $_GET['q'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    if ($action === 'create') {
        $name = $data['name'] ?? '';
        $address = $data['address'] ?? '';
        $description = $data['description'] ?? '';
        $coordinates = $data['coordinates'] ?? '';
        $image = $data['image'] ?? '';

        if (!$name || !$address || !$coordinates) {
            http_response_code(400);
            echo json_encode(['error' => 'Name, address, and coordinates are required']);
            exit();
        }

        // Parse lat/lng from coordinates string "lat,lng"
        $parts = explode(',', $coordinates);
        $lat = isset($parts[0]) ? trim($parts[0]) : null;
        $lng = isset($parts[1]) ? trim($parts[1]) : null;

        try {
            $stmt = $pdo->prepare("INSERT INTO mosques (name, address, description, coordinates, latitude, longitude, image, followers_count, points) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)");
            $stmt->execute([$name, $address, $description, $coordinates, $lat, $lng, $image]);
            $newId = $pdo->lastInsertId();

            echo json_encode(['message' => 'Mosque added successfully', 'id' => $newId]);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add mosque: ' . $e->getMessage()]);
        }
        exit();
    }
    elseif ($action === 'update') {
        $mosque_id = $data['id'] ?? 0;
        if (!$mosque_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Mosque ID is required']);
            exit();
        }

        $fields = [];
        $values = [];

        if (isset($data['image']) && $data['image']) {
            $fields[] = 'image = ?';
            $values[] = $data['image'];
        }
        if (isset($data['name']) && $data['name']) {
            $fields[] = 'name = ?';
            $values[] = $data['name'];
        }
        if (isset($data['address']) && $data['address']) {
            $fields[] = 'address = ?';
            $values[] = $data['address'];
        }
        if (isset($data['description'])) {
            $fields[] = 'description = ?';
            $values[] = $data['description'];
        }
        if (isset($data['hub_vibe'])) {
            $fields[] = 'hub_vibe = ?';
            $values[] = $data['hub_vibe'];
        }
        if (isset($data['instagram_handle'])) {
            $fields[] = 'instagram_handle = ?';
            $values[] = $data['instagram_handle'];
        }
        if (isset($data['tiktok_handle'])) {
            $fields[] = 'tiktok_handle = ?';
            $values[] = $data['tiktok_handle'];
        }
        if (isset($data['org_name'])) {
            $fields[] = 'org_name = ?';
            $values[] = $data['org_name'];
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit();
        }

        try {
            $values[] = $mosque_id;
            $stmt = $pdo->prepare("UPDATE mosques SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($values);
            echo json_encode(['message' => 'Masjid berhasil diperbarui']);
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update mosque: ' . $e->getMessage()]);
        }
        exit();
    }
}

try {
    if ($action === 'list') {
        $stmt = $pdo->query("
            SELECT m.*,
                COALESCE(AVG(r.rating), 0) AS avg_rating,
                COUNT(r.id) AS review_count
            FROM mosques m
            LEFT JOIN masjid_reviews r ON r.masjid_id = m.id
            GROUP BY m.id
            ORDER BY m.points DESC
            LIMIT 50
        ");
        $mosques = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($mosques);
    }
    elseif ($action === 'details' && $id) {
        $stmt = $pdo->prepare("SELECT * FROM mosques WHERE id = ?");
        $stmt->execute([$id]);
        $mosque = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($mosque) {
            // Include recent events for this mosque
            $stmtEvents = $pdo->prepare("SELECT * FROM events WHERE mosque_id = ? ORDER BY date ASC LIMIT 5");
            $stmtEvents->execute([$id]);
            $mosque['upcoming_events'] = $stmtEvents->fetchAll(PDO::FETCH_ASSOC);

            // Include youth broadcasts
            $stmtBroadcasts = $pdo->prepare("SELECT * FROM youth_broadcasts WHERE mosque_id = ? ORDER BY created_at DESC LIMIT 10");
            $stmtBroadcasts->execute([$id]);
            $mosque['youth_broadcasts'] = $stmtBroadcasts->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($mosque);
        }
        else {
            http_response_code(404);
            echo json_encode(['error' => 'Mosque not found']);
        }
    }
    elseif ($action === 'search') {
        $stmt = $pdo->prepare("
            SELECT m.*,
                COALESCE(AVG(r.rating), 0) AS avg_rating,
                COUNT(r.id) AS review_count
            FROM mosques m
            LEFT JOIN masjid_reviews r ON r.masjid_id = m.id
            WHERE m.name LIKE ? OR m.address LIKE ?
            GROUP BY m.id
            ORDER BY m.points DESC
        ");
        $searchTerm = "%$q%";
        $stmt->execute([$searchTerm, $searchTerm]);
        $mosques = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($mosques);
    }
    elseif ($action === 'nearby') {
        $lat = isset($_GET['lat']) ? floatval($_GET['lat']) : null;
        $lng = isset($_GET['lng']) ? floatval($_GET['lng']) : null;
        $radius = isset($_GET['radius']) ? floatval($_GET['radius']) : 0.5; // default 0.5 km (500m)
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;

        if ($lat === null || $lng === null) {
            http_response_code(400);
            echo json_encode(['error' => 'lat and lng parameters are required']);
            exit();
        }

        // ST_Distance_Sphere: returns distance in meters between two POINT(lng, lat)
        $radiusMeters = $radius * 1000;
        $stmt = $pdo->prepare("
            SELECT m.*,
                COALESCE(AVG(r.rating), 0) AS avg_rating,
                COUNT(r.id) AS review_count,
                ST_Distance_Sphere(
                    POINT(m.longitude, m.latitude),
                    POINT(:lng, :lat)
                ) AS distance_meters
            FROM mosques m
            LEFT JOIN masjid_reviews r ON r.masjid_id = m.id
            WHERE m.latitude IS NOT NULL AND m.longitude IS NOT NULL
            GROUP BY m.id
            HAVING distance_meters <= :radius
            ORDER BY distance_meters ASC
            LIMIT :lmt
        ");
        $stmt->bindValue(':lng', $lng, PDO::PARAM_STR);
        $stmt->bindValue(':lat', $lat, PDO::PARAM_STR);
        $stmt->bindValue(':radius', $radiusMeters, PDO::PARAM_STR);
        $stmt->bindValue(':lmt', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $mosques = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Add formatted distance to each result
        foreach ($mosques as &$m) {
            $dist = floatval($m['distance_meters']);
            if ($dist < 1000) {
                $m['distance_text'] = round($dist) . ' m';
            }
            else {
                $m['distance_text'] = round($dist / 1000, 1) . ' km';
            }
        }

        echo json_encode($mosques);
    }
}
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
