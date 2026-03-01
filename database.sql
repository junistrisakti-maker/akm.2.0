-- Database: akm_genz

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `points` int(11) DEFAULT 0,
  `streak` int(11) DEFAULT 0,
  `badges` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`badges`)),
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ... existing tables ...

CREATE TABLE IF NOT EXISTS `buddies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `buddy_id` int(11) NOT NULL,
  `status` enum('pending', 'accepted') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_buddy` (`user_id`, `buddy_id`),
  CONSTRAINT `b_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `b_buddy_fk` FOREIGN KEY (`buddy_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `event_attendees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attendee` (`event_id`, `user_id`),
  CONSTRAINT `ea_event_fk` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ea_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('video','image') NOT NULL,
  `caption` text DEFAULT NULL,
  `url` varchar(255) NOT NULL,
  `bg_color` varchar(20) DEFAULT '#0f172a',
  `audio_name` varchar(100) DEFAULT NULL,
  `likes` int(11) DEFAULT 0,
  `comments` int(11) DEFAULT 0,
  `shares` int(11) DEFAULT 0,
  `saves` int(11) DEFAULT 0,
  `tags` varchar(255) DEFAULT NULL,
  `rating` DECIMAL(3,1) DEFAULT 0.0,
  `review_count` int(11) DEFAULT 0,
  `location_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `location` varchar(100) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `attendees_count` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `donations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `donor_name` varchar(50) DEFAULT 'Hamba Allah',
  `amount` decimal(10,2) NOT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `post_interactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `interaction_type` enum('like', 'save') NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_interaction` (`user_id`, `post_id`, `interaction_type`),
  CONSTRAINT `pi_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pi_post_fk` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dummy Data
-- All dummy users use 'password' as their actual password (hashed version used below)
INSERT INTO `users` (`username`, `email`, `password`, `points`, `streak`) VALUES
('ustadz_hanan', 'hanan@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1500, 10),
('remajamasjid_sby', 'sby@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1200, 5),
('muslim_creative', 'creative@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 900, 3),
('akm_official', 'admin@akm.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 5000, 30);

INSERT INTO `posts` (`user_id`, `type`, `caption`, `url`, `bg_color`, `audio_name`, `tags`, `rating`, `review_count`, `location_name`) VALUES
(1, 'video', 'Jangan lupa Al-Kahfi ya guys! ✨', '', '#1e293b', 'Surah Al-Kahfi - Misyari Rashid', '#JumatBerkah #Reminder', 4.9, 342, 'Masjid Istiqlal'),
(2, 'image', 'Kajian rutin malam minggu, yuk merapat! Ada kopi gratis ☕️', 'https://images.unsplash.com/photo-1542156822-6924d1a71ace', '#0f172a', 'Original Sound - Remaja Masjid SBY', '#NgajiAsik #PemudaHijrah', 4.7, 120, 'Masjid Al-Akbar Surabaya'),
(3, 'video', 'Tutorial wudhu yang benar check! ✅', '', '#334155', 'Instrumental - Peace', '#BelajarIslam #FiqihDasar', 4.8, 89, NULL),
(4, 'image', 'Masjid vibes at sunset 🌅 MasyaAllah tabarakallah.', 'https://images.unsplash.com/photo-1574515569485-300438183187', '#1e293b', 'Adzan Maghrib - Makkah', '#MosqueTraveler', 5.0, 560, 'Masjid Raya Sumatera Barat');

INSERT INTO `events` (`title`, `date`, `time`, `location`, `attendees_count`) VALUES
('Kajian Rutin & Ngopi Santai', '2024-02-25', '19:30:00', 'Masjid Raya Bintaro', 42),
('Subuh Berjamaah & Breakfast', '2024-02-26', '04:30:00', 'Masjid Al-Azhar', 15);

INSERT INTO `donations` (`donor_name`, `amount`, `message`) VALUES
('Hamba Allah', 50000, 'Semoga berkah'),
('Rizky', 100000, 'Untuk operasional masjid'),
('Siti', 25000, 'Sedekah subuh');
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `n_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
