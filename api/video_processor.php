<?php
// Video processing library using FFmpeg
class VideoProcessor
{
    private $pdo;
    private $ffmpegPath;
    private $ffprobePath;
    private $outputDir;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->ffmpegPath = $this->findFFmpeg();
        $this->ffprobePath = $this->findFFprobe();
        $this->outputDir = '../uploads/processed/';

        if (!is_dir($this->outputDir)) {
            mkdir($this->outputDir, 0777, true);
        }

        if (!$this->ffmpegPath) {
            throw new Exception('FFmpeg is not installed or not found in PATH');
        }
    }

    private function findFFmpeg()
    {
        $paths = [
            '/usr/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            'ffmpeg', // Try system PATH
            'C:\\ffmpeg\\bin\\ffmpeg.exe', // Windows
            'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe'
        ];

        foreach ($paths as $path) {
            if (is_executable($path) || ($path === 'ffmpeg' && shell_exec("which ffmpeg") !== '')) {
                return $path;
            }
        }

        return null;
    }

    private function findFFprobe()
    {
        $paths = [
            '/usr/bin/ffprobe',
            '/usr/local/bin/ffprobe',
            'ffprobe', // Try system PATH
            'C:\\ffmpeg\\bin\\ffprobe.exe', // Windows
            'C:\\Program Files\\ffmpeg\\bin\\ffprobe.exe'
        ];

        foreach ($paths as $path) {
            if (is_executable($path) || ($path === 'ffprobe' && shell_exec("which ffprobe") !== '')) {
                return $path;
            }
        }

        return null;
    }

    public function getVideoInfo($videoPath)
    {
        if (!file_exists($videoPath)) {
            throw new Exception('Video file not found');
        }

        $cmd = escapeshellcmd($this->ffprobePath) . ' -v quiet -print_format json -show_format -show_streams ' . escapeshellarg($videoPath);
        $output = shell_exec($cmd);
        $info = json_decode($output, true);

        if (!$info) {
            throw new Exception('Failed to get video information');
        }

        // Extract relevant information
        $videoStream = null;
        $audioStream = null;

        foreach ($info['streams'] as $stream) {
            if ($stream['codec_type'] === 'video' && !$videoStream) {
                $videoStream = $stream;
            }
            elseif ($stream['codec_type'] === 'audio' && !$audioStream) {
                $audioStream = $stream;
            }
        }

        return [
            'duration' => floatval($info['format']['duration'] ?? 0),
            'size' => intval($info['format']['size'] ?? 0),
            'bit_rate' => intval($info['format']['bit_rate'] ?? 0),
            'format' => $info['format']['format_name'] ?? '',
            'video' => $videoStream ? [
                'codec' => $videoStream['codec_name'] ?? '',
                'width' => intval($videoStream['width'] ?? 0),
                'height' => intval($videoStream['height'] ?? 0),
                'frame_rate' => $videoStream['r_frame_rate'] ?? '',
                'bit_rate' => intval($videoStream['bit_rate'] ?? 0),
                'pixel_format' => $videoStream['pix_fmt'] ?? ''
            ] : null,
            'audio' => $audioStream ? [
                'codec' => $audioStream['codec_name'] ?? '',
                'sample_rate' => intval($audioStream['sample_rate'] ?? 0),
                'channels' => intval($audioStream['channels'] ?? 0),
                'bit_rate' => intval($audioStream['bit_rate'] ?? 0)
            ] : null
        ];
    }

    public function compressVideo($inputPath, $outputPath = null, $options = [])
    {
        if (!file_exists($inputPath)) {
            throw new Exception('Input video file not found');
        }

        if (!$outputPath) {
            $filename = pathinfo($inputPath, PATHINFO_FILENAME);
            $outputPath = $this->outputDir . $filename . '_compressed.mp4';
        }

        // Default compression options
        $defaultOptions = [
            'video_codec' => 'libx264',
            'audio_codec' => 'aac',
            'crf' => 23, // Constant Rate Factor (0-51, lower = better quality)
            'preset' => 'medium', // ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow
            'max_bitrate' => '2M', // Maximum bitrate
            'buffer_size' => '4M', // Buffer size
            'resolution' => null, // e.g., '1280x720'
            'fps' => null, // e.g., 30
            'remove_audio' => false
        ];

        $options = array_merge($defaultOptions, $options);

        // Build FFmpeg command
        $cmd = escapeshellcmd($this->ffmpegPath);

        // Input
        $cmd .= ' -i ' . escapeshellarg($inputPath);

        // Video options
        if ($options['resolution']) {
            $cmd .= ' -vf scale=' . escapeshellarg($options['resolution']);
        }

        if ($options['fps']) {
            $cmd .= ' -r ' . intval($options['fps']);
        }

        $cmd .= ' -c:v ' . escapeshellarg($options['video_codec']);
        $cmd .= ' -crf ' . intval($options['crf']);
        $cmd .= ' -preset ' . escapeshellarg($options['preset']);
        $cmd .= ' -maxrate ' . escapeshellarg($options['max_bitrate']);
        $cmd .= ' -bufsize ' . escapeshellarg($options['buffer_size']);

        // Audio options
        if (!$options['remove_audio']) {
            $cmd .= ' -c:a ' . escapeshellarg($options['audio_codec']);
            $cmd .= ' -b:a 128k'; // Audio bitrate
        }
        else {
            $cmd .= ' -an'; // No audio
        }

        // Output options
        $cmd .= ' -movflags +faststart'; // For web streaming
        $cmd .= ' -y'; // Overwrite output file
        $cmd .= ' ' . escapeshellarg($outputPath);

        // Execute command
        $this->executeCommand($cmd);

        if (!file_exists($outputPath)) {
            throw new Exception('Video compression failed - output file not created');
        }

        // Get compression stats
        $originalInfo = $this->getVideoInfo($inputPath);
        $compressedInfo = $this->getVideoInfo($outputPath);

        $sizeReduction = $originalInfo['size'] - $compressedInfo['size'];
        $sizeReductionPercent = ($sizeReduction / $originalInfo['size']) * 100;

        return [
            'success' => true,
            'input_path' => $inputPath,
            'output_path' => $outputPath,
            'original_size' => $originalInfo['size'],
            'compressed_size' => $compressedInfo['size'],
            'size_reduction' => $sizeReduction,
            'size_reduction_percent' => round($sizeReductionPercent, 2),
            'original_duration' => $originalInfo['duration'],
            'compressed_duration' => $compressedInfo['duration'],
            'compression_ratio' => round($compressedInfo['size'] / $originalInfo['size'], 3)
        ];
    }

    public function generateThumbnail($videoPath, $outputPath = null, $timestamp = '00:00:01', $width = 320)
    {
        if (!file_exists($videoPath)) {
            throw new Exception('Video file not found');
        }

        if (!$outputPath) {
            $filename = pathinfo($videoPath, PATHINFO_FILENAME);
            $outputPath = $this->outputDir . $filename . '_thumb.jpg';
        }

        $cmd = escapeshellcmd($this->ffmpegPath);
        $cmd .= ' -i ' . escapeshellarg($videoPath);
        $cmd .= ' -ss ' . escapeshellarg($timestamp);
        $cmd .= ' -vframes 1';
        $cmd .= ' -vf scale=' . intval($width) . ':-1';
        $cmd .= ' -y ' . escapeshellarg($outputPath);

        $this->executeCommand($cmd);

        if (!file_exists($outputPath)) {
            throw new Exception('Thumbnail generation failed');
        }

        return [
            'success' => true,
            'thumbnail_path' => $outputPath,
            'timestamp' => $timestamp,
            'width' => $width
        ];
    }

    public function generateAnimatedGif($videoPath, $outputPath = null, $startTime = '00:00:01', $duration = 3, $width = 320)
    {
        if (!file_exists($videoPath)) {
            throw new Exception('Video file not found');
        }

        if (!$outputPath) {
            $filename = pathinfo($videoPath, PATHINFO_FILENAME);
            $outputPath = $this->outputDir . $filename . '.gif';
        }

        // Generate palette for better quality
        $palettePath = $this->outputDir . 'palette_' . uniqid() . '.png';

        $cmd = escapeshellcmd($this->ffmpegPath);
        $cmd .= ' -i ' . escapeshellarg($videoPath);
        $cmd .= ' -ss ' . escapeshellarg($startTime);
        $cmd .= ' -t ' . intval($duration);
        $cmd .= ' -vf scale=' . intval($width) . ':-1:palettegen';
        $cmd .= ' -y ' . escapeshellarg($palettePath);

        $this->executeCommand($cmd);

        // Generate GIF using palette
        $cmd = escapeshellcmd($this->ffmpegPath);
        $cmd .= ' -i ' . escapeshellarg($videoPath);
        $cmd .= ' -i ' . escapeshellarg($palettePath);
        $cmd .= ' -ss ' . escapeshellarg($startTime);
        $cmd .= ' -t ' . intval($duration);
        $cmd .= ' -lavfi scale=' . intval($width) . ':-1 [x]; [x][1:v] paletteuse';
        $cmd .= ' -y ' . escapeshellarg($outputPath);

        $this->executeCommand($cmd);

        // Clean up palette file
        if (file_exists($palettePath)) {
            unlink($palettePath);
        }

        if (!file_exists($outputPath)) {
            throw new Exception('GIF generation failed');
        }

        return [
            'success' => true,
            'gif_path' => $outputPath,
            'start_time' => $startTime,
            'duration' => $duration,
            'width' => $width
        ];
    }

    public function extractAudio($videoPath, $outputPath = null, $format = 'mp3')
    {
        if (!file_exists($videoPath)) {
            throw new Exception('Video file not found');
        }

        if (!$outputPath) {
            $filename = pathinfo($videoPath, PATHINFO_FILENAME);
            $outputPath = $this->outputDir . $filename . '.' . $format;
        }

        $cmd = escapeshellcmd($this->ffmpegPath);
        $cmd .= ' -i ' . escapeshellarg($videoPath);
        $cmd .= ' -vn'; // No video
        $cmd .= ' -acodec ' . escapeshellarg($format);
        $cmd .= ' -ab 128k'; // Audio bitrate
        $cmd .= ' -y ' . escapeshellarg($outputPath);

        $this->executeCommand($cmd);

        if (!file_exists($outputPath)) {
            throw new Exception('Audio extraction failed');
        }

        return [
            'success' => true,
            'audio_path' => $outputPath,
            'format' => $format
        ];
    }

    public function createAdaptiveStreams($videoPath, $outputDir = null)
    {
        if (!file_exists($videoPath)) {
            throw new Exception('Video file not found');
        }

        if (!$outputDir) {
            $filename = pathinfo($videoPath, PATHINFO_FILENAME);
            $outputDir = $this->outputDir . $filename . '_adaptive/';
        }

        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0777, true);
        }

        // Define different quality levels
        $qualities = [
            ['name' => '480p', 'resolution' => '854x480', 'bitrate' => '1000k'],
            ['name' => '720p', 'resolution' => '1280x720', 'bitrate' => '2500k'],
            ['name' => '1080p', 'resolution' => '1920x1080', 'bitrate' => '5000k']
        ];

        $streams = [];

        foreach ($qualities as $quality) {
            $outputPath = $outputDir . $quality['name'] . '.mp4';

            $cmd = escapeshellcmd($this->ffmpegPath);
            $cmd .= ' -i ' . escapeshellarg($videoPath);
            $cmd .= ' -vf scale=' . escapeshellarg($quality['resolution']);
            $cmd .= ' -c:v libx264';
            $cmd .= ' -b:v ' . escapeshellarg($quality['bitrate']);
            $cmd .= ' -c:a aac';
            $cmd .= ' -b:a 128k';
            $cmd .= ' -f mp4';
            $cmd .= ' -movflags +faststart';
            $cmd .= ' -y ' . escapeshellarg($outputPath);

            $this->executeCommand($cmd);

            if (file_exists($outputPath)) {
                $streams[] = [
                    'name' => $quality['name'],
                    'path' => $outputPath,
                    'resolution' => $quality['resolution'],
                    'bitrate' => $quality['bitrate']
                ];
            }
        }

        return [
            'success' => true,
            'output_dir' => $outputDir,
            'streams' => $streams
        ];
    }

    private function executeCommand($cmd)
    {
        $descriptorspec = [
            0 => ['pipe', 'r'], // stdin
            1 => ['pipe', 'w'], // stdout
            2 => ['pipe', 'w'] // stderr
        ];

        $process = proc_open($cmd, $descriptorspec, $pipes);

        if (!is_resource($process)) {
            throw new Exception('Failed to start FFmpeg process');
        }

        // Close stdin
        fclose($pipes[0]);

        // Read stdout and stderr
        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);

        fclose($pipes[1]);
        fclose($pipes[2]);

        // Close process and get exit code
        $exitCode = proc_close($process);

        if ($exitCode !== 0) {
            throw new Exception("FFmpeg command failed with exit code {$exitCode}: {$stderr}");
        }

        return $stdout;
    }

    public function batchProcess($videoPaths, $operation = 'compress', $options = [])
    {
        $results = [];

        foreach ($videoPaths as $videoPath) {
            try {
                if (!file_exists($videoPath)) {
                    $results[$videoPath] = ['success' => false, 'error' => 'File not found'];
                    continue;
                }

                switch ($operation) {
                    case 'compress':
                        $result = $this->compressVideo($videoPath, null, $options);
                        break;
                    case 'thumbnail':
                        $result = $this->generateThumbnail($videoPath, null, $options['timestamp'] ?? '00:00:01', $options['width'] ?? 320);
                        break;
                    case 'gif':
                        $result = $this->generateAnimatedGif($videoPath, null, $options['start_time'] ?? '00:00:01', $options['duration'] ?? 3, $options['width'] ?? 320);
                        break;
                    case 'audio':
                        $result = $this->extractAudio($videoPath, null, $options['format'] ?? 'mp3');
                        break;
                    default:
                        $result = ['success' => false, 'error' => 'Unknown operation'];
                }

                $results[$videoPath] = $result;

            }
            catch (Exception $e) {
                $results[$videoPath] = ['success' => false, 'error' => $e->getMessage()];
            }
        }

        return $results;
    }

    public function getProcessingStats()
    {
        $stmt = $this->pdo->prepare("
            SELECT 
                operation_type,
                COUNT(*) as total_processed,
                COUNT(CASE WHEN success = 1 THEN 1 END) as successful,
                COUNT(CASE WHEN success = 0 THEN 1 END) as failed,
                AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as avg_processing_time,
                SUM(original_size) as total_original_size,
                SUM(processed_size) as total_processed_size
            FROM video_processing_log 
            WHERE started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY operation_type
        ");

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Direct API call handler
if (basename($_SERVER['PHP_SELF']) == 'video_processor.php') {
    header('Content-Type: application/json');
    require_once 'config.php';

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        try {
            $data = json_decode(file_get_contents("php://input"), true);
            $action = $data['action'] ?? 'info';

            $processor = new VideoProcessor($pdo);

            switch ($action) {
                case 'info':
                    $videoPath = $data['video_path'] ?? null;
                    if (!$videoPath || !file_exists($videoPath))
                        throw new Exception('Valid video path is required');
                    $info = $processor->getVideoInfo($videoPath);
                    echo json_encode(['success' => true, 'data' => $info]);
                    break;
                case 'compress':
                    $videoPath = $data['video_path'] ?? null;
                    $outputPath = $data['output_path'] ?? null;
                    $options = $data['options'] ?? [];
                    if (!$videoPath || !file_exists($videoPath))
                        throw new Exception('Valid video path is required');
                    $result = $processor->compressVideo($videoPath, $outputPath, $options);
                    echo json_encode($result);
                    break;
                case 'thumbnail':
                    $videoPath = $data['video_path'] ?? null;
                    $outputPath = $data['output_path'] ?? null;
                    $timestamp = $data['timestamp'] ?? '00:00:01';
                    $width = intval($data['width'] ?? 320);
                    if (!$videoPath || !file_exists($videoPath))
                        throw new Exception('Valid video path is required');
                    $result = $processor->generateThumbnail($videoPath, $outputPath, $timestamp, $width);
                    echo json_encode($result);
                    break;
                case 'gif':
                    $videoPath = $data['video_path'] ?? null;
                    $outputPath = $data['output_path'] ?? null;
                    $startTime = $data['start_time'] ?? '00:00:01';
                    $duration = intval($data['duration'] ?? 3);
                    $width = intval($data['width'] ?? 320);
                    if (!$videoPath || !file_exists($videoPath))
                        throw new Exception('Valid video path is required');
                    $result = $processor->generateAnimatedGif($videoPath, $outputPath, $startTime, $duration, $width);
                    echo json_encode($result);
                    break;
                case 'audio':
                    $videoPath = $data['video_path'] ?? null;
                    $outputPath = $data['output_path'] ?? null;
                    $format = $data['format'] ?? 'mp3';
                    if (!$videoPath || !file_exists($videoPath))
                        throw new Exception('Valid video path is required');
                    $result = $processor->extractAudio($videoPath, $outputPath, $format);
                    echo json_encode($result);
                    break;
                case 'batch':
                    $videoPaths = $data['video_paths'] ?? [];
                    $operation = $data['operation'] ?? 'compress';
                    $options = $data['options'] ?? [];
                    if (empty($videoPaths))
                        throw new Exception('Video paths array is required');
                    $results = $processor->batchProcess($videoPaths, $operation, $options);
                    echo json_encode(['success' => true, 'results' => $results]);
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
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        try {
            $action = $_GET['action'] ?? 'stats';
            $processor = new VideoProcessor($pdo);
            if ($action === 'stats') {
                $stats = $processor->getProcessingStats();
                echo json_encode(['success' => true, 'data' => $stats]);
            }
            else {
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
