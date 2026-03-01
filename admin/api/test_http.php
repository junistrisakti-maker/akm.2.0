<?php
$url = "http://www.google.com";
echo "Testing $url...\n";
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$error = curl_error($ch);
echo "Error: $error\n";
echo "Response Code: " . curl_getinfo($ch, CURLINFO_HTTP_CODE) . "\n";
echo "Response Length: " . strlen($response) . "\n";
curl_close($ch);
?>
