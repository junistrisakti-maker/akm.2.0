<?php
header('Content-Type: application/json');
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('groq_api_key', 'ai_system_prompt')");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        echo json_encode(['success' => true, 'settings' => $settings]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        $apiKey = $data['groq_api_key'] ?? null;
        $systemPrompt = $data['ai_system_prompt'] ?? null;

        if ($apiKey === null && $systemPrompt === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No data provided']);
            exit;
        }

        $pdo->beginTransaction();

        if ($apiKey !== null) {
            $stmt = $pdo->prepare("INSERT INTO system_settings (setting_key, setting_value, setting_group, description) 
                                   VALUES ('groq_api_key', ?, 'ai', 'API Key for Groq Llama Integration') 
                                   ON DUPLICATE KEY UPDATE setting_value = ?");
            $stmt->execute([$apiKey, $apiKey]);
        }

        if ($systemPrompt !== null) {
            $stmt = $pdo->prepare("INSERT INTO system_settings (setting_key, setting_value, setting_group, description) 
                                   VALUES ('ai_system_prompt', ?, 'ai', 'Persona and Instructions for SohibMasjid') 
                                   ON DUPLICATE KEY UPDATE setting_value = ?");
            $stmt->execute([$systemPrompt, $systemPrompt]);
        }

        $pdo->commit();
        echo json_encode(['success' => true]);
    }
    catch (PDOException $e) {
        if ($pdo->inTransaction())
            $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
