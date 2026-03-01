<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';

$action = $_GET['action'] ?? 'list';

if ($action === 'list') {
    // Sample static tour data for Phase 13 demonstration
    $tours = [
        [
            "id" => "istiqlal",
            "name" => "Masjid Istiqlal",
            "location" => "Jakarta, Indonesia",
            "thumbnail" => "https://images.unsplash.com/photo-1590076214667-c0f33b98c44c?auto=format&fit=crop&q=80&w=400",
            "scenes" => [
                [
                    "id" => "main_hall",
                    "title" => "Main Prayer Hall",
                    "panorama" => "https://pannellum.org/images/alma.jpg", // Sample 360 pano
                    "hotspots" => [
                        [
                            "pitch" => -10,
                            "yaw" => 170,
                            "type" => "info",
                            "text" => "Historical Dome - Built in 1978",
                            "URL" => "#"
                        ],
                        [
                            "pitch" => 0,
                            "yaw" => 0,
                            "type" => "scene",
                            "text" => "Go to Corridor",
                            "sceneId" => "corridor"
                        ]
                    ]
                ]
            ]
        ],
        [
            "id" => "nabawi",
            "name" => "Masjid Nabawi",
            "location" => "Madinah, Saudi Arabia",
            "thumbnail" => "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=400",
            "scenes" => [
                [
                    "id" => "courtyard",
                    "title" => "Umbrella Courtyard",
                    "panorama" => "https://pannellum.org/images/jfk.jpg", // Sample 360 pano
                    "hotspots" => []
                ]
            ]
        ]
    ];

    echo json_encode($tours);
}
?>
