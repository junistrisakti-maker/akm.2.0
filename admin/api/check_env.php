<?php
echo "HTTP_PROXY: " . getenv('HTTP_PROXY') . "\n";
echo "HTTPS_PROXY: " . getenv('HTTPS_PROXY') . "\n";
echo "ALL_PROXY: " . getenv('ALL_PROXY') . "\n";
echo "no_proxy: " . getenv('no_proxy') . "\n";
echo "PHP Version: " . phpversion() . "\n";
echo "CURL Version: " . print_r(curl_version(), true) . "\n";
?>
