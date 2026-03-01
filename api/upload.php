<?php
header('Content-Type: application/json');
require 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['image'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No image uploaded']);
        exit;
    }

    $file = $_FILES['image'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Only JPG, PNG, WEBP are allowed.']);
        exit;
    }

    $uploadDir = '../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $fileName = time() . '_' . basename($file['name']);
    $targetPath = $uploadDir . $fileName;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Return the relative URL from the root of the project
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $url = $protocol . "://" . $host . "/AKM.2.0/uploads/" . $fileName;

        echo json_encode(['url' => $url]);
    }
    else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to move uploaded file']);
    }
}
else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
