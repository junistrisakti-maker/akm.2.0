<?php

class GamificationEngine
{
    private $pdo;
    private $xpConfig = [
        'check_in' => ['xp' => 50, 'limit' => 5, 'category' => 'active'],
        'early_bird' => ['xp' => 20, 'limit' => 5, 'category' => 'active'],
        'donation' => ['xp' => 10, 'per_amount' => 5000, 'category' => 'contribution'],
        'ai_talk' => ['xp' => 5, 'limit' => 10, 'category' => 'engagement'],
        'challenge' => ['xp' => 100, 'category' => 'active'],
        'share' => ['xp' => 25, 'limit' => 3, 'category' => 'social'],
        'referral' => ['xp' => 250, 'category' => 'social'],
        'quran_read' => ['xp' => 15, 'limit' => 20, 'category' => 'literacy'],
        'review' => ['xp' => 100, 'limit' => 1, 'category' => 'feedback'],
        'prayer_aamiin' => ['xp' => 5, 'limit' => 20, 'category' => 'engagement']
    ];

    private $rankMilestones = [
        ['name' => 'Rookie', 'xp' => 0, 'color' => 'cyan'],
        ['name' => 'Pro', 'xp' => 1000, 'color' => 'slate'],
        ['name' => 'Elite', 'xp' => 5000, 'color' => 'amber'],
        ['name' => 'Chief', 'xp' => 15000, 'color' => 'purple'],
        ['name' => 'Master', 'xp' => 50000, 'color' => 'emerald']
    ];

    private $circleMilestones = [
        ['name' => 'Cell', 'xp' => 0],
        ['name' => 'Node', 'xp' => 5000],
        ['name' => 'Hub', 'xp' => 25000],
        ['name' => 'Nexus', 'xp' => 100000]
    ];

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function awardXP($userId, $actionType, $metadata = [])
    {
        if (!isset($this->xpConfig[$actionType]))
            return false;

        $config = $this->xpConfig[$actionType];
        $xpToAward = $config['xp'];

        // Handle Donation special case (10 XP per 5000)
        if ($actionType === 'donation' && isset($metadata['amount'])) {
            $xpToAward = floor($metadata['amount'] / $config['per_amount']) * $config['xp'];
        }

        // Check Daily Limit
        if (isset($config['limit'])) {
            if (!$this->checkDailyLimit($userId, $actionType, $config['limit'])) {
                return ['status' => 'limit_reached', 'message' => 'Limit harian tercapai'];
            }
        }

        // Apply Friday Multiplier
        if (date('N') == 5) { // 5 is Friday
            $xpToAward *= 2;
            $metadata['multiplier'] = 'Friday Double XP';
        }

        try {
            $this->pdo->beginTransaction();

            // Update user XP
            $stmt = $this->pdo->prepare("UPDATE users SET xp = xp + ?, last_activity_date = CURDATE() WHERE id = ?");
            $stmt->execute([$xpToAward, $userId]);

            // Log XP
            $stmtLog = $this->pdo->prepare("INSERT INTO xp_logs (user_id, action_type, xp_earned, metadata) VALUES (?, ?, ?, ?)");
            $stmtLog->execute([$userId, $actionType, $xpToAward, json_encode($metadata)]);

            // Update Daily Limit table
            $this->updateDailyLimit($userId, $actionType);

            // Update Daily Mission Progress
            $this->updateMissionProgress($userId, $actionType);

            // Check for Rank Upgrade
            $rankStatus = $this->checkRankUpgrade($userId);

            // Check for Badge Eligibility
            $this->checkBadgeEligibility($userId);

            // Award XP to User's Circles
            $this->awardCircleXP($userId, $xpToAward);

            $this->pdo->commit();

            return [
                'status' => 'success',
                'xp_earned' => $xpToAward,
                'rank_up' => $rankStatus['rank_up'],
                'new_rank' => $rankStatus['new_rank']
            ];

        }
        catch (PDOException $e) {
            $this->pdo->rollBack();
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    private function checkDailyLimit($userId, $actionType, $limit)
    {
        $today = date('Y-m-d');
        $stmt = $this->pdo->prepare("SELECT daily_count FROM xp_daily_limits WHERE user_id = ? AND action_type = ? AND last_reset_date = ?");
        $stmt->execute([$userId, $actionType, $today]);
        $row = $stmt->fetch();

        if ($row && $row['daily_count'] >= $limit) {
            return false;
        }
        return true;
    }

    private function updateDailyLimit($userId, $actionType)
    {
        $today = date('Y-m-d');
        $stmt = $this->pdo->prepare("INSERT INTO xp_daily_limits (user_id, action_type, daily_count, last_reset_date) 
            VALUES (?, ?, 1, ?) 
            ON DUPLICATE KEY UPDATE daily_count = daily_count + 1");
        $stmt->execute([$userId, $actionType, $today]);
    }

    private function checkRankUpgrade($userId)
    {
        $stmt = $this->pdo->prepare("SELECT xp, level FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        $currentXp = $user['xp'];
        $currentLevel = $user['level'];
        $newLevel = 1;

        foreach ($this->rankMilestones as $index => $milestone) {
            if ($currentXp >= $milestone['xp']) {
                $newLevel = $index + 1;
            }
        }

        if ($newLevel > $currentLevel) {
            $stmtUpdate = $this->pdo->prepare("UPDATE users SET level = ? WHERE id = ?");
            $stmtUpdate->execute([$newLevel, $userId]);

            // Log rank up to xp_logs
            $newRank = $this->rankMilestones[$newLevel - 1]['name'];
            $stmtRankLog = $this->pdo->prepare("INSERT INTO xp_logs (user_id, action_type, xp_earned, description) VALUES (?, 'rank_up', 0, ?)");
            $stmtRankLog->execute([$userId, "Level Up to $newRank"]);

            return ['rank_up' => true, 'new_rank' => $newRank];
        }

        return ['rank_up' => false, 'new_rank' => $this->rankMilestones[$currentLevel - 1]['name']];
    }

    public function checkBadgeEligibility($userId)
    {
        try {
            // Fetch User Stats
            $stmtUser = $this->pdo->prepare("SELECT xp, level, streak FROM users WHERE id = ?");
            $stmtUser->execute([$userId]);
            $user = $stmtUser->fetch();

            if (!$user)
                return;

            // Fetch eligible badges not yet owned
            $stmtBadges = $this->pdo->prepare("
                SELECT * FROM badges 
                WHERE id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = ?)
            ");
            $stmtBadges->execute([$userId]);
            $potentialBadges = $stmtBadges->fetchAll();

            foreach ($potentialBadges as $badge) {
                $eligible = false;
                switch ($badge['requirement_type']) {
                    case 'streak':
                        if ($user['streak'] >= $badge['requirement_value'])
                            $eligible = true;
                        break;
                    case 'level':
                        if ($user['level'] >= $badge['requirement_value'])
                            $eligible = true;
                        break;
                    case 'total_xp':
                        if ($user['xp'] >= $badge['requirement_value'])
                            $eligible = true;
                        break;
                }

                if ($eligible) {
                    $stmtAward = $this->pdo->prepare("INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)");
                    $stmtAward->execute([$userId, $badge['id']]);

                    // Notify User
                    $stmtNotif = $this->pdo->prepare("INSERT INTO notifications (user_id, type, message) VALUES (?, 'badge_earned', ?)");
                    $msg = "🎉 Selamat! Kamu mendapatkan badge baru: " . $badge['name'] . " - " . $badge['description'];
                    $stmtNotif->execute([$userId, $msg]);
                }
            }
        }
        catch (PDOException $e) {
        // Log error or ignore
        }
    }

    public function getRankVisuals($level)
    {
        $index = $level - 1;
        if (!isset($this->rankMilestones[$index]))
            $index = 0;
        return $this->rankMilestones[$index];
    }

    private function awardCircleXP($userId, $xpAmount)
    {
        // Get all circles user is member of
        $stmt = $this->pdo->prepare("SELECT circle_id FROM circle_members WHERE user_id = ?");
        $stmt->execute([$userId]);
        $circles = $stmt->fetchAll(PDO::FETCH_COLUMN);

        foreach ($circles as $circleId) {
            // Update Circle XP
            $stmtUpdate = $this->pdo->prepare("UPDATE circles SET total_xp = total_xp + ? WHERE id = ?");
            $stmtUpdate->execute([$xpAmount, $circleId]);

            // Check Circle Reputation Rank
            $this->checkCircleReputation($circleId);
        }
    }

    private function checkCircleReputation($circleId)
    {
        $stmt = $this->pdo->prepare("SELECT total_xp, reputation_level FROM circles WHERE id = ?");
        $stmt->execute([$circleId]);
        $circle = $stmt->fetch();

        if (!$circle)
            return;

        $currentXp = $circle['total_xp'];
        $currentRep = $circle['reputation_level'];
        $newRep = 'Cell';

        foreach ($this->circleMilestones as $milestone) {
            if ($currentXp >= $milestone['xp']) {
                $newRep = $milestone['name'];
            }
        }

        if ($newRep !== $currentRep) {
            $stmtUpdate = $this->pdo->prepare("UPDATE circles SET reputation_level = ? WHERE id = ?");
            $stmtUpdate->execute([$newRep, $circleId]);

            // Log global activity for Nexus rank
            if ($newRep === 'Nexus') {
                $stmtName = $this->pdo->prepare("SELECT name FROM circles WHERE id = ?");
                $stmtName->execute([$circleId]);
                $circleName = $stmtName->fetchColumn();

                // We'll use a special type for global ticker in notifications or a dedicated table
                $stmtNotif = $this->pdo->prepare("INSERT INTO notifications (user_id, type, message) 
                    SELECT user_id, 'circle_nexus', ? FROM circle_members WHERE circle_id = ?");
                $stmtNotif->execute(["Selamat! Circle '$circleName' telah mencapai level NEXUS! 🔥", $circleId]);
            }
        }
    }

    private function updateMissionProgress($userId, $actionType)
    {
        $today = date('Y-m-d');
        try {
            // Find missions that match this action type
            $stmt = $this->pdo->prepare("SELECT id, target_count FROM daily_missions WHERE action_type = ?");
            $stmt->execute([$actionType]);
            $missions = $stmt->fetchAll();

            foreach ($missions as $mission) {
                $missionId = $mission['id'];
                $target = $mission['target_count'];

                // Get or create user progress for today
                $stmtProgress = $this->pdo->prepare("
                    INSERT INTO user_mission_progress (user_id, mission_id, current_count, last_updated_date) 
                    VALUES (?, ?, 1, ?) 
                    ON DUPLICATE KEY UPDATE 
                        current_count = CASE 
                            WHEN status = 'in_progress' THEN current_count + 1 
                            ELSE current_count 
                        END
                ");
                $stmtProgress->execute([$userId, $missionId, $today]);

                // Update status to 'completed' if target reached
                $stmtCheck = $this->pdo->prepare("
                    UPDATE user_mission_progress 
                    SET status = 'completed' 
                    WHERE user_id = ? AND mission_id = ? AND last_updated_date = ? 
                    AND current_count >= ? AND status = 'in_progress'
                ");
                $stmtCheck->execute([$userId, $missionId, $today, $target]);
            }
        }
        catch (PDOException $e) {
        // Silently fail mission progress
        }
    }
}
?>
