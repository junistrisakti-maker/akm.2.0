<?php
// Google Vision moderation library
class GoogleVisionModerator
{
    private $pdo;
    private $apiKey;
    private $apiUrl = 'https://vision.googleapis.com/v1/images:annotate';

    // Confidence thresholds (0-1)
    private $adultThreshold = 0.6;
    private $violenceThreshold = 0.6;
    private $racyThreshold = 0.7;
    private $spoofThreshold = 0.8;
    private $medicalThreshold = 0.8;
    private $isEnabled = true;

    // Label-based moderation
    private $blockedLabels = [
        'weapon', 'gun', 'knife', 'sword', 'rifle', 'pistol',
        'blood', 'gore', 'violence', 'fighting', 'war',
        'drug', 'marijuana', 'cocaine', 'heroin', 'pill',
        'alcohol', 'beer', 'wine', 'liquor',
        'tobacco', 'cigarette', 'smoking', 'vape',
        'gambling', 'casino', 'poker', 'betting',
        'adult', 'nudity', 'sexual', 'pornography',
        'swimsuit', 'underwear', 'lingerie', 'bikini'
    ];

    public function __construct($pdo, $apiKey = null)
    {
        $this->pdo = $pdo;
        $this->apiKey = $apiKey ?: $this->getApiKey();

        $this->loadSettings();
    }

    private function getApiKey()
    {
        try {
            // Priority: Environment Variable > system_settings table
            return $_ENV['GOOGLE_VISION_API_KEY'] ??
                $this->pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'google_vision_api_key'")->fetchColumn() ??
                null;
        }
        catch (Exception $e) {
            return null;
        }
    }

    private function loadSettings()
    {
        try {
            $stmt = $this->pdo->query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key LIKE 'moderation_%' OR setting_key = 'google_vision_enabled'");
            $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

            $this->isEnabled = ($settings['google_vision_enabled'] ?? 'true') === 'true';
            $this->adultThreshold = floatval($settings['moderation_threshold_adult'] ?? 0.6);
            $this->violenceThreshold = floatval($settings['moderation_threshold_violence'] ?? 0.6);
            $this->racyThreshold = floatval($settings['moderation_threshold_racy'] ?? 0.7);
            $this->spoofThreshold = floatval($settings['moderation_threshold_spoof'] ?? 0.8);
            $this->medicalThreshold = floatval($settings['moderation_threshold_medical'] ?? 0.8);
        }
        catch (Exception $e) {
            error_log("Moderation settings load error: " . $e->getMessage());
        }
    }

    public function analyzeImage($imagePath)
    {
        if (!$this->isEnabled || !$this->apiKey) {
            return [
                'success' => true,
                'decision' => [
                    'approved' => true,
                    'skipped' => true,
                    'reason' => !$this->isEnabled ? 'AI Moderation disabled' : 'Missing API Key'
                ]
            ];
        }

        try {
            // Read and encode image
            $imageContent = file_get_contents($imagePath);
            $imageBase64 = base64_encode($imageContent);

            // Prepare request
            $requestData = [
                'requests' => [
                    [
                        'image' => [
                            'content' => $imageBase64
                        ],
                        'features' => [
                            ['type' => 'SAFE_SEARCH_DETECTION'],
                            ['type' => 'LABEL_DETECTION', 'maxResults' => 20],
                            ['type' => 'WEB_DETECTION', 'maxResults' => 10],
                            ['type' => 'TEXT_DETECTION'],
                            ['type' => 'OBJECT_LOCALIZATION', 'maxResults' => 10]
                        ]
                    ]
                ]
            ];

            // Make API request
            $response = $this->makeApiRequest($requestData);

            if (!$response || !isset($response['responses'][0])) {
                throw new Exception('Invalid API response');
            }

            $analysis = $response['responses'][0];

            // Process safe search detection
            $safeSearch = $this->processSafeSearch($analysis['safeSearchAnnotation'] ?? []);

            // Process label detection
            $labels = $this->processLabels($analysis['labelAnnotations'] ?? []);

            // Process web detection
            $webDetection = $this->processWebDetection($analysis['webDetection'] ?? []);

            // Process text detection
            $textDetection = $this->processTextDetection($analysis['textAnnotations'] ?? []);

            // Process object detection
            $objects = $this->processObjects($analysis['localizedObjectAnnotations'] ?? []);

            // Make moderation decision
            $decision = $this->makeModerationDecision($safeSearch, $labels, $webDetection, $textDetection, $objects);

            // Log the analysis
            $this->logAnalysis($imagePath, $decision, $analysis);

            return [
                'success' => true,
                'decision' => $decision,
                'analysis' => [
                    'safe_search' => $safeSearch,
                    'labels' => $labels,
                    'web_detection' => $webDetection,
                    'text_detection' => $textDetection,
                    'objects' => $objects
                ],
                'confidence' => $decision['confidence'],
                'reasons' => $decision['reasons']
            ];

        }
        catch (Exception $e) {
            // Log error
            $this->logError($imagePath, $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'decision' => [
                    'approved' => false,
                    'confidence' => 0,
                    'reasons' => ['API Error: ' . $e->getMessage()]
                ]
            ];
        }
    }

    private function makeApiRequest($requestData)
    {
        $ch = curl_init($this->apiUrl . '?key=' . $this->apiKey);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($requestData),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);

        curl_close($ch);

        if ($error) {
            throw new Exception('cURL Error: ' . $error);
        }

        if ($httpCode !== 200) {
            throw new Exception("API Error: HTTP {$httpCode}");
        }

        $decoded = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON response');
        }

        if (isset($decoded['error'])) {
            throw new Exception('API Error: ' . $decoded['error']['message']);
        }

        return $decoded;
    }

    private function processSafeSearch($safeSearch)
    {
        $likelihoods = [
            'UNKNOWN' => 0,
            'VERY_UNLIKELY' => 0.1,
            'UNLIKELY' => 0.3,
            'POSSIBLE' => 0.5,
            'LIKELY' => 0.7,
            'VERY_LIKELY' => 0.9
        ];

        return [
            'adult' => [
                'likelihood' => $safeSearch['adult'] ?? 'UNKNOWN',
                'score' => $likelihoods[$safeSearch['adult'] ?? 'UNKNOWN'] ?? 0,
                'threshold' => $this->adultThreshold
            ],
            'spoof' => [
                'likelihood' => $safeSearch['spoof'] ?? 'UNKNOWN',
                'score' => $likelihoods[$safeSearch['spoof'] ?? 'UNKNOWN'] ?? 0,
                'threshold' => $this->spoofThreshold
            ],
            'medical' => [
                'likelihood' => $safeSearch['medical'] ?? 'UNKNOWN',
                'score' => $likelihoods[$safeSearch['medical'] ?? 'UNKNOWN'] ?? 0,
                'threshold' => $this->medicalThreshold
            ],
            'violence' => [
                'likelihood' => $safeSearch['violence'] ?? 'UNKNOWN',
                'score' => $likelihoods[$safeSearch['violence'] ?? 'UNKNOWN'] ?? 0,
                'threshold' => $this->violenceThreshold
            ],
            'racy' => [
                'likelihood' => $safeSearch['racy'] ?? 'UNKNOWN',
                'score' => $likelihoods[$safeSearch['racy'] ?? 'UNKNOWN'] ?? 0,
                'threshold' => $this->racyThreshold
            ]
        ];
    }

    private function processLabels($labels)
    {
        $processedLabels = [];
        $blockedLabelsFound = [];

        foreach ($labels as $label) {
            $description = strtolower($label['description'] ?? '');
            $score = $label['score'] ?? 0;

            $processedLabels[] = [
                'description' => $label['description'],
                'score' => $score,
                'blocked' => in_array($description, $this->blockedLabels)
            ];

            if (in_array($description, $this->blockedLabels)) {
                $blockedLabelsFound[] = $description;
            }
        }

        return [
            'labels' => $processedLabels,
            'blocked_found' => $blockedLabelsFound,
            'total_blocked' => count($blockedLabelsFound)
        ];
    }

    private function processWebDetection($webDetection)
    {
        $pages = $webDetection['pagesWithMatchingImages'] ?? [];
        $images = $webDetection['visuallySimilarImages'] ?? [];
        $entities = $webDetection['webEntities'] ?? [];

        // Check for suspicious domains
        $suspiciousDomains = ['adult', 'porn', 'xxx', 'sex', 'nsfw'];
        $suspiciousPages = [];

        foreach ($pages as $page) {
            $url = $page['url'] ?? '';
            foreach ($suspiciousDomains as $domain) {
                if (strpos(strtolower($url), $domain) !== false) {
                    $suspiciousPages[] = $url;
                    break;
                }
            }
        }

        return [
            'pages_count' => count($pages),
            'similar_images_count' => count($images),
            'entities_count' => count($entities),
            'suspicious_pages' => $suspiciousPages,
            'suspicious_count' => count($suspiciousPages)
        ];
    }

    private function processTextDetection($textAnnotations)
    {
        $texts = [];
        $suspiciousTexts = [];

        foreach ($textAnnotations as $annotation) {
            $text = $annotation['description'] ?? '';
            if (!empty($text)) {
                $texts[] = $text;

                // Check for suspicious content in text
                if ($this->containsSuspiciousText($text)) {
                    $suspiciousTexts[] = $text;
                }
            }
        }

        return [
            'texts' => $texts,
            'suspicious_texts' => $suspiciousTexts,
            'suspicious_count' => count($suspiciousTexts)
        ];
    }

    private function processObjects($objects)
    {
        $detectedObjects = [];
        $suspiciousObjects = [];

        foreach ($objects as $object) {
            $name = strtolower($object['name'] ?? '');
            $score = $object['score'] ?? 0;

            $detectedObjects[] = [
                'name' => $object['name'],
                'score' => $score
            ];

            // Check for suspicious objects
            if (in_array($name, $this->blockedLabels)) {
                $suspiciousObjects[] = $object['name'];
            }
        }

        return [
            'objects' => $detectedObjects,
            'suspicious_objects' => $suspiciousObjects,
            'suspicious_count' => count($suspiciousObjects)
        ];
    }

    private function containsSuspiciousText($text)
    {
        $suspiciousPatterns = [
            '/\b(18\+|adult|xxx|porn|sex|nude|naked)\b/i',
            '/\b(drug|marijuana|cocaine|heroin|weed)\b/i',
            '/\b(weapon|gun|knife|kill|murder)\b/i',
            '/\b(hate|racist|nazi|terror)\b/i'
        ];

        foreach ($suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $text)) {
                return true;
            }
        }

        return false;
    }

    private function makeModerationDecision($safeSearch, $labels, $webDetection, $textDetection, $objects)
    {
        $reasons = [];
        $confidence = 1.0;
        $approved = true;

        // Check safe search violations
        if ($safeSearch['adult']['score'] >= $this->adultThreshold) {
            $approved = false;
            $reasons[] = 'Adult content detected';
            $confidence = min($confidence, $safeSearch['adult']['score']);
        }

        if ($safeSearch['violence']['score'] >= $this->violenceThreshold) {
            $approved = false;
            $reasons[] = 'Violent content detected';
            $confidence = min($confidence, $safeSearch['violence']['score']);
        }

        if ($safeSearch['racy']['score'] >= $this->racyThreshold) {
            $approved = false;
            $reasons[] = 'Inappropriate content detected';
            $confidence = min($confidence, $safeSearch['racy']['score']);
        }

        // Check blocked labels
        if ($labels['total_blocked'] > 0) {
            $approved = false;
            $reasons[] = 'Blocked content detected: ' . implode(', ', $labels['blocked_found']);
            $confidence = min($confidence, 0.8);
        }

        // Check suspicious web pages
        if ($webDetection['suspicious_count'] > 2) {
            $approved = false;
            $reasons[] = 'Image appears on suspicious websites';
            $confidence = min($confidence, 0.7);
        }

        // Check suspicious text
        if ($textDetection['suspicious_count'] > 0) {
            $approved = false;
            $reasons[] = 'Suspicious text detected in image';
            $confidence = min($confidence, 0.6);
        }

        // Check suspicious objects
        if ($objects['suspicious_count'] > 0) {
            $approved = false;
            $reasons[] = 'Suspicious objects detected: ' . implode(', ', $objects['suspicious_objects']);
            $confidence = min($confidence, 0.7);
        }

        return [
            'approved' => $approved,
            'confidence' => $confidence,
            'reasons' => $reasons,
            'requires_review' => !$approved && $confidence < 0.8
        ];
    }

    private function logAnalysis($imagePath, $decision, $analysis)
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO vision_analysis_log 
            (file_path, approved, confidence, reasons, analysis_data, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
        ");

        $stmt->execute([
            $imagePath,
            $decision['approved'] ? 1 : 0,
            $decision['confidence'],
            json_encode($decision['reasons']),
            json_encode($analysis)
        ]);
    }

    private function logError($imagePath, $error)
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO vision_analysis_log 
            (file_path, approved, confidence, reasons, error_message, created_at) 
            VALUES (?, 0, 0, ?, ?, NOW())
        ");

        $stmt->execute([
            $imagePath,
            ['API Error'],
            $error
        ]);
    }

    public function batchAnalyze($imagePaths)
    {
        $results = [];

        foreach ($imagePaths as $imagePath) {
            if (file_exists($imagePath)) {
                $results[$imagePath] = $this->analyzeImage($imagePath);
            }
            else {
                $results[$imagePath] = [
                    'success' => false,
                    'error' => 'File not found'
                ];
            }

            // Add small delay to avoid rate limiting
            usleep(100000); // 0.1 second
        }

        return $results;
    }

    public function updateThresholds($adult, $violence, $racy, $spoof, $medical)
    {
        $this->adultThreshold = floatval($adult);
        $this->violenceThreshold = floatval($violence);
        $this->racyThreshold = floatval($racy);
        $this->spoofThreshold = floatval($spoof);
        $this->medicalThreshold = floatval($medical);

        // Save to system_settings
        $stmt = $this->pdo->prepare("
            UPDATE system_settings 
            SET setting_value = ?, updated_at = NOW() 
            WHERE setting_key = ?
        ");

        $stmt->execute([$this->adultThreshold, 'moderation_threshold_adult']);
        $stmt->execute([$this->violenceThreshold, 'moderation_threshold_violence']);
        $stmt->execute([$this->racyThreshold, 'moderation_threshold_racy']);
        $stmt->execute([$this->spoofThreshold, 'moderation_threshold_spoof']);
        $stmt->execute([$this->medicalThreshold, 'moderation_threshold_medical']);
    }
}

// Direct API call handler
if (basename($_SERVER['PHP_SELF']) == 'google_vision_moderator.php') {
    header('Content-Type: application/json');
    require_once 'config.php';

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        try {
            $data = json_decode(file_get_contents("php://input"), true);
            $action = $data['action'] ?? 'analyze';

            $apiKey = $data['api_key'] ?? null;
            $moderator = new GoogleVisionModerator($pdo, $apiKey);

            switch ($action) {
                case 'analyze':
                    $imagePath = $data['image_path'] ?? null;
                    if (!$imagePath || !file_exists($imagePath))
                        throw new Exception('Valid image path is required');
                    $result = $moderator->analyzeImage($imagePath);
                    echo json_encode($result);
                    break;
                case 'batch_analyze':
                    $imagePaths = $data['image_paths'] ?? [];
                    if (empty($imagePaths))
                        throw new Exception('Image paths array is required');
                    $results = $moderator->batchAnalyze($imagePaths);
                    echo json_encode(['success' => true, 'results' => $results]);
                    break;
                case 'update_thresholds':
                    $thresholds = $data['thresholds'] ?? [];
                    $moderator->updateThresholds(
                        $thresholds['adult'] ?? 0.6,
                        $thresholds['violence'] ?? 0.6,
                        $thresholds['racy'] ?? 0.7,
                        $thresholds['spoof'] ?? 0.8,
                        $thresholds['medical'] ?? 0.8
                    );
                    echo json_encode(['success' => true, 'message' => 'Thresholds updated']);
                    break;
                default:
                    throw new Exception('Invalid action');
            }
        }
        catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
?>
