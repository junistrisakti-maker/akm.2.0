<?php
$urls = ["https://www.google.com", "https://api.cloudinary.com/v1_1/dhva6cij1/ping"];
foreach ($urls as $url) {
    echo "Testing $url...\n";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $error = curl_error($ch);
    echo "Error: $error\n";
    echo "Response Code: " . curl_getinfo($ch, CURLINFO_HTTP_CODE) . "\n\n";
    curl_close($ch);
}
?>
