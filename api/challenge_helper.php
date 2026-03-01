<?php

/**
 * Updates challenge progress for a user based on an action type.
 * 
 * @param PDO $pdo The database connection
 * @param int $userId The ID of the user performing the action
 * @param string $type The category of the challenge (post, checkin, donation)
 */
function updateChallengeProgress($pdo, $userId, $type)
{
    try {
        // 1. Get all active challenges of this type
        // Note: is_active might be 1 by default, or 0 if deactivated.
        $stmt = $pdo->prepare("SELECT id, target_count, points_reward, title FROM challenges WHERE type = ? AND is_active = 1");
        $stmt->execute([$type]);
        $activeChallenges = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($activeChallenges)) {
            return;
        }

        foreach ($activeChallenges as $challenge) {
            $challengeId = $challenge['id'];
            $targetCount = $challenge['target_count'];
            $pointsReward = $challenge['points_reward'];

            // 2. Check if user already has an entry in user_challenges
            $stmt = $pdo->prepare("SELECT id, current_count, is_completed FROM user_challenges WHERE user_id = ? AND challenge_id = ?");
            $stmt->execute([$userId, $challengeId]);
            $progress = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$progress) {
                // Initialize new progress entry
                $stmt = $pdo->prepare("INSERT INTO user_challenges (user_id, challenge_id, current_count, is_completed) VALUES (?, ?, 1, ?)");
                $isCompleted = (1 >= $targetCount) ? 1 : 0;
                $stmt->execute([$userId, $challengeId, $isCompleted]);

                if ($isCompleted) {
                    awardChallengeReward($pdo, $userId, $pointsReward, $challenge['title']);
                }
            }
            else {
                // If already completed, skip
                if ($progress['is_completed']) {
                    continue;
                }

                $newCount = $progress['current_count'] + 1;
                $isCompleted = ($newCount >= $targetCount) ? 1 : 0;

                $stmt = $pdo->prepare("UPDATE user_challenges SET current_count = ?, is_completed = ? WHERE id = ?");
                $stmt->execute([$newCount, $isCompleted, $progress['id']]);

                if ($isCompleted) {
                    awardChallengeReward($pdo, $userId, $pointsReward, $challenge['title']);
                }
            }
        }
    }
    catch (PDOException $e) {
        error_log("Error updating challenge progress: " . $e->getMessage());
    }
}

/**
 * Awards points and sends a notification when a challenge is completed.
 */
function awardChallengeReward($pdo, $userId, $points, $challengeTitle)
{
    try {
        // 1. Update user points
        $stmt = $pdo->prepare("UPDATE users SET points = points + ? WHERE id = ?");
        $stmt->execute([$points, $userId]);

        // 2. Create notification
        // Corrected schema: user_id, type, message
        $stmt = $pdo->prepare("INSERT INTO notifications (user_id, type, message) VALUES (?, 'challenge', ?)");
        $title = "Tantangan Selesai! 🎉";
        $message = "$title Selamat! Kamu telah menyelesaikan tantangan '$challengeTitle' dan mendapatkan $points poin bonus.";
        $stmt->execute([$userId, $message]);

    }
    catch (PDOException $e) {
        echo "PDO ERROR in awardChallengeReward: " . $e->getMessage() . "\n";
        error_log("Error awarding challenge reward: " . $e->getMessage());
    }
}
