<?php
require_once 'config.php';

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS circles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            icon VARCHAR(255),
            theme_color VARCHAR(10) DEFAULT '#422AFB',
            category ENUM('Tahsin', 'Ekonomi', 'Sosial', 'Relawan', 'Challenge') DEFAULT 'Sosial',
            slug VARCHAR(100) UNIQUE,
            created_by INT,
            invite_code VARCHAR(10) UNIQUE,
            member_count INT DEFAULT 0,
            is_temporary BOOLEAN DEFAULT FALSE,
            expires_at TIMESTAMP NULL,
            status ENUM('active', 'archived', 'expired') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS circle_members (
            id INT AUTO_INCREMENT PRIMARY KEY,
            circle_id INT,
            user_id INT,
            role ENUM('member', 'moderator', 'admin') DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS circle_kpis (
            id INT AUTO_INCREMENT PRIMARY KEY,
            circle_id INT,
            kpi_name VARCHAR(100),
            unit VARCHAR(50),
            target_value INT,
            FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS circle_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            circle_id INT,
            user_id INT,
            kpi_id INT,
            value INT DEFAULT 0,
            logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE CASCADE,
            FOREIGN KEY (kpi_id) REFERENCES circle_kpis(id) ON DELETE CASCADE
        );
    ");
    echo "Tables created successfully.\n";

    // Insert some default circles if empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM circles");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("
            INSERT INTO circles (name, description, category, theme_color, slug) VALUES 
            ('Tahsin Muda', 'Belajar Al-Quran bersama teman sebaya', 'Tahsin', '#a78bfa', 'tahsin-muda'),
            ('Bisnis Syariah', 'Diskusi ekonomi dan bisnis islami', 'Ekonomi', '#34d399', 'bisnis-syariah'),
            ('Hijrah Squad', 'Komunitas pemuda hijrah', 'Sosial', '#ec4899', 'hijrah-squad'),
            ('Volunteer AKM', 'Relawan kegiatan keagamaan', 'Relawan', '#fbbf24', 'volunteer-akm')
        ");
        echo "Default circles inserted.\n";
    }

}
catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
