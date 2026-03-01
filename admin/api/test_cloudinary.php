<?php
require_once __DIR__ . '/../../api/config.php';

$stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'cloudinary_%'");
$settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

echo "--- DATABASE SETTINGS ---\n";
foreach ($settings as $k => $v) {
    echo "[$k] => [" . $v . "] (Length: " . strlen($v) . ")\n";
}

$cloudName = trim($settings['cloudinary_cloud_name'] ?? '');

if ($cloudName) {
    $url = "https://api.cloudinary.com/v1_1/$cloudName/video/upload";
    echo "\n--- TESTING CONNECTION ---\n";
    echo "URL: $url\n";

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true); // We just want to see if it exists
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "HTTP Status Code: $httpCode\n";
    if ($httpCode == 404) {
        echo "RESULT: Cloud Name is likely INVALID or URL structure is wrong.\n";
    }
    else {
        echo "RESULT: URL is reachable (Code $httpCode).\n";
    }
}
else {
    echo "\nRESULT: Cloud Name is missing in settings.\n";
}
?>
