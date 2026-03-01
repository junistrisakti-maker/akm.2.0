<?php
$url = "https://api.cloudinary.com/v1_1/dhva6cij1/ping"; // Replace dhva6cij1 with your cloud name if different
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
curl_setopt($ch, CURLOPT_PROXY, "");
curl_setopt($ch, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1_2);
curl_setopt($ch, CURLOPT_SSL_CIPHER_LIST, 'DEFAULT@SECLEVEL=1');
curl_setopt($ch, CURLOPT_VERBOSE, true);
$verbose = fopen('php://temp', 'w+');
curl_setopt($ch, CURLOPT_STDERR, $verbose);

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

rewind($verbose);
$verboseLog = stream_get_contents($verbose);
echo "Response: $response\n";
echo "Error: $error\n";
echo "--- Verbose Log ---\n$verboseLog\n";
?>
