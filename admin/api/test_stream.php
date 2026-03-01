<?php
echo "Testing file_get_contents('https://www.google.com')...\n";
$arrContextOptions = [
    "ssl" => [
        "verify_peer" => false,
        "verify_peer_name" => false,
    ],
];
$resp = @file_get_contents("https://www.google.com", false, stream_context_create($arrContextOptions));
if ($resp === false) {
    echo "Error: file_get_contents failed.\n";
    print_r(error_get_last());
}
else {
    echo "Success! Length: " . strlen($resp) . "\n";
}
?>
