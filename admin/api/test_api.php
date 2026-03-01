<?php
ob_start();
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['action'] = 'getBuddies';
$_GET['userId'] = 1;
require_once 'api/social.php';
$output = ob_get_clean();
echo "--- API RESPONSE ---\n";
echo $output;
echo "\n--- END RESPONSE ---\n";
?>
