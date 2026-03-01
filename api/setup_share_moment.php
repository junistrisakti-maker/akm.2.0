<?php
require 'config.php';

try {
    // 1. Multiple media per post
    $pdo->exec("CREATE TABLE IF NOT EXISTS `post_media` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `post_id` int(11) NOT NULL,
        `media_url` varchar(255) NOT NULL,
        `media_type` enum('image', 'video') NOT NULL,
        `file_size` int(11) NOT NULL,
        `original_name` varchar(255) DEFAULT NULL,
        `sort_order` int(11) DEFAULT 0,
        `created_at` timestamp NULL DEFAULT current_timestamp(),
        PRIMARY KEY (`id`),
        KEY `post_id` (`post_id`),
        CONSTRAINT `pm_post_fk` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "✅ Checked post_media table.<br>";

    // 2. Content moderation queue
    $pdo->exec("CREATE TABLE IF NOT EXISTS `content_review_queue` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `file_path` varchar(255) NOT NULL,
        `mime_type` varchar(100) NOT NULL,
        `status` enum('pending', 'approved', 'rejected') DEFAULT 'pending',
        `reviewed_by` int(11) DEFAULT NULL,
        `review_notes` text DEFAULT NULL,
        `created_at` timestamp NULL DEFAULT current_timestamp(),
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "✅ Checked content_review_queue table.<br>";

    // 3. Vision analysis log
    $pdo->exec("CREATE TABLE IF NOT EXISTS `vision_analysis_log` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `file_path` varchar(255) NOT NULL,
        `approved` tinyint(1) DEFAULT 0,
        `confidence` decimal(3,2) DEFAULT 0.00,
        `reasons` text DEFAULT NULL,
        `analysis_data` longtext DEFAULT NULL,
        `error_message` text DEFAULT NULL,
        `created_at` timestamp NULL DEFAULT current_timestamp(),
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "✅ Checked vision_analysis_log table.<br>";

    // 4. Moderation settings
    $pdo->exec("CREATE TABLE IF NOT EXISTS `moderation_settings` (
        `key` varchar(50) NOT NULL,
        `value` varchar(255) NOT NULL,
        `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (`key`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "✅ Checked moderation_settings table.<br>";

    // 5. Video processing log
    $pdo->exec("CREATE TABLE IF NOT EXISTS `video_processing_log` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `operation_type` varchar(50) NOT NULL,
        `input_path` varchar(255) NOT NULL,
        `output_path` varchar(255) DEFAULT NULL,
        `original_size` int(11) NOT NULL,
        `processed_size` int(11) DEFAULT NULL,
        `success` tinyint(1) DEFAULT 0,
        `error_message` text DEFAULT NULL,
        `started_at` timestamp NULL DEFAULT current_timestamp(),
        `completed_at` timestamp NULL DEFAULT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    echo "✅ Checked video_processing_log table.<br>";

    // 6. Update posts table if needed (e.g., adding status)
    $stmt = $pdo->query("SHOW COLUMNS FROM `posts` LIKE 'status'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE `posts` ADD COLUMN `status` enum('active', 'pending', 'blocked') DEFAULT 'active' AFTER `tags` ");
        echo "✅ Added status column to posts table.<br>";
    }

    // 7. Seed system_settings with moderation parameters
    $moderationSettings = [
        ['group' => 'ai', 'key' => 'google_vision_enabled', 'value' => 'true', 'description' => 'Enable/Disable Google Cloud Vision AI Moderation'],
        ['group' => 'ai', 'key' => 'google_vision_api_key', 'value' => '', 'description' => 'Google Cloud Vision API Key for content moderation'],
        ['group' => 'ai', 'key' => 'moderation_threshold_adult', 'value' => '0.6', 'description' => 'Threshold for adult content (0.0 - 1.0)'],
        ['group' => 'ai', 'key' => 'moderation_threshold_violence', 'value' => '0.6', 'description' => 'Threshold for violence detection (0.0 - 1.0)'],
        ['group' => 'ai', 'key' => 'moderation_threshold_racy', 'value' => '0.7', 'description' => 'Threshold for racy/inappropriate content (0.0 - 1.0)'],
        ['group' => 'ai', 'key' => 'moderation_threshold_spoof', 'value' => '0.8', 'description' => 'Threshold for spoof/memes detection (0.0 - 1.0)'],
        ['group' => 'ai', 'key' => 'moderation_threshold_medical', 'value' => '0.8', 'description' => 'Threshold for medical/surgical content (0.0 - 1.0)']
    ];

    $stmt = $pdo->prepare("
        INSERT INTO system_settings (setting_group, setting_key, setting_value, description) 
        VALUES (?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE description = VALUES(description)
    ");

    foreach ($moderationSettings as $s) {
        $stmt->execute([$s['group'], $s['key'], $s['value'], $s['description']]);
    }
    echo "✅ Seeded system_settings with moderation parameters.<br>";

    echo "<h3>System setup complete! tables are ready.</h3>";
}
catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>
