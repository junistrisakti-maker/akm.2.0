<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once 'config.php';

class RealtimeHelper
{
    private static $pusher = null;

    private static function init()
    {
        if (self::$pusher !== null)
            return;

        $app_id = getSetting('pusher_app_id');
        $key = getSetting('pusher_app_key');
        $secret = getSetting('pusher_app_secret');
        $cluster = getSetting('pusher_app_cluster');

        if (!$app_id || !$key || !$secret) {
            error_log("Pusher configuration missing");
            return;
        }

        self::$pusher = new Pusher\Pusher(
            $key,
            $secret,
            $app_id,
        [
            'cluster' => $cluster ?: 'ap1',
            'useTLS' => true
        ]
            );
    }

    /**
     * Trigger a real-time event.
     * Channel naming convention: user-{id} for targeted notifications, or 'global'
     */
    public static function trigger($channel, $event, $data)
    {
        self::init();
        if (self::$pusher) {
            try {
                self::$pusher->trigger($channel, $event, $data);
                return true;
            }
            catch (Exception $e) {
                error_log("Pusher error: " . $e->getMessage());
            }
        }
        return false;
    }

    /**
     * Notify a specific user instantly
     */
    public static function notifyUser($userId, $type, $message, $extra = [])
    {
        $payload = array_merge([
            'type' => $type,
            'message' => $message,
            'timestamp' => date('c')
        ], $extra);

        return self::trigger("user-$userId", 'notification', $payload);
    }
}
?>
