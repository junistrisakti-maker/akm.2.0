<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS')
    exit;

// 1. Fetch Groq API Key from System Settings
try {
    $stmt = $pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'groq_api_key'");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $apiKey = $result['setting_value'] ?? '';

    if (empty($apiKey)) {
        http_response_code(500);
        echo json_encode(['error' => 'Groq API Key is not configured. Please contact admin.']);
        exit();
    }
}
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Configuration error']);
    exit();
}

// 2. Fetch System Prompt (Persona)
try {
    $stmt = $pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'ai_system_prompt'");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    $defaultPrompt = "Identitas: Kamu adalah 'Sohib Masjid', asisten digital resmi untuk platform AyoKeMasjid. Kamu adalah asisten yang sopan, religius, namun modern dan sangat efisien.
Gaya Bahasa: Gunakan sapaan islami yang hangat (Assalamu'alaikum, Akhi/Ukhti, Bapak/Ibu). Singkat, padat, dan informatif.

RUANG LINGKUP TUGAS (HANYA boleh menjawab topik berikut):
1. Bimbingan Al-Quran & Tajwid: Membantu pencarian ayat, menjelaskan hukum tajwid (sesuai fitur Mushaf Pro), dan motivasi membaca Al-Quran.
2. Edukasi VR Manasik: Menjelaskan tata cara Haji dan Umrah (Manasik) sebagai pemandu untuk fitur VR Ka'bah di aplikasi.
3. Layanan Masjid: Informasi jadwal salat, agenda kajian, dan pengelolaan zakat/infaq.
4. Fikih Dasar: Hanya seputar ibadah sehari-hari (salat, wudu, puasa) berdasarkan panduan umum moderat.

BATASAN KETAT (GUARDRAILS):
- DILARANG memberikan fatwa hukum berat atau kontroversial. Arahkan pengguna ke Imam Masjid jika pertanyaan kompleks.
- DILARANG membahas politik, ekonomi makro, hiburan luar, atau hal tidak relevan dengan masjid.
- Jika di luar lingkup, GUNAKAN JAWABAN STANDAR: 'Mohon maaf, sebagai Sohib Masjid, saya fokus membantu Anda dalam urusan ibadah dan informasi masjid. Untuk pertanyaan tersebut, silakan hubungi pengurus masjid secara langsung.'";

    $systemPrompt = $result['setting_value'] ?? $defaultPrompt;
}
catch (PDOException $e) {
    // Fallback to default if DB fails
    $systemPrompt = $defaultPrompt;
}

// 3. Process Chat Request
$data = json_decode(file_get_contents("php://input"), true);
$message = $data['message'] ?? '';
$history = $data['history'] ?? [];

if (empty($message)) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required']);
    exit();
}

// 4. Prepare Groq API Request (OpenAI Compatible)
$url = "https://api.groq.com/openai/v1/chat/completions";

$messages = [];
$messages[] = ["role" => "system", "content" => $systemPrompt];

foreach ($history as $h) {
    $role = ($h['role'] === 'user') ? 'user' : 'assistant';
    $messages[] = ["role" => $role, "content" => $h['content']];
}

// Add latest message
$messages[] = ["role" => "user", "content" => $message];

$payload = [
    "model" => "llama-3.3-70b-versatile",
    "messages" => $messages,
    "temperature" => 0.7,
    "max_tokens" => 1024
];


$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For local dev

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code($httpCode);
    $errorData = json_decode($response, true);
    $errorMessage = $errorData['error']['message'] ?? 'Groq API Error';
    echo json_encode(['error' => $errorMessage]);
    exit();
}

$jsonResponse = json_decode($response, true);
$aiMessage = $jsonResponse['choices'][0]['message']['content'] ?? 'Mohon maaf, Sohib Masjid sedang beristirahat sebentar. Silakan coba lagi nanti ya!';

echo json_encode(['reply' => $aiMessage]);
?>
