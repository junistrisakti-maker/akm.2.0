<?php
require_once __DIR__ . '/auth/check-session.php';
require_once __DIR__ . '/../api/config.php';

$page_title = 'Kelola API';
$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $keys = [
        'cloudinary_cloud_name',
        'cloudinary_api_key',
        'cloudinary_api_secret',
        'cloudinary_folder',
        'whatsapp_api_key',
        'whatsapp_token',
        'whatsapp_instance_id',
        'google_cloud_vision_key',
        'midtrans_client_key',
        'midtrans_server_key',
        'midtrans_is_production',
        'google_maps_api_key'
    ];

    try {
        $stmt = $pdo->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = ?");
        foreach ($keys as $key) {
            $val = $_POST[$key] ?? '';
            $stmt->execute([$val, $key]);
        }
        $message = "Semua konfigurasi API berhasil diperbarui!";
    }
    catch (PDOException $e) {
        $message = "Error: " . $e->getMessage();
    }
}

// Fetch current values
$settings = $pdo->query("SELECT setting_key, setting_value FROM settings")->fetchAll(PDO::FETCH_KEY_PAIR);

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

    <!-- Main Content -->
    <main class="flex-1 lg:ml-64 p-8">
        <?php require_once __DIR__ . '/includes/navbar.php'; ?>

        <div class="max-w-6xl mx-auto mt-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 class="text-2xl font-black text-slate-900 tracking-tight">Konfigurasi Ekosistem API</h1>
                    <p class="text-sm text-slate-500 font-medium mt-1">Pusat kendali seluruh layanan pihak ketiga aplikasi AKM.</p>
                </div>
                <div class="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100/50">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sistem Operasional</span>
                </div>
            </div>

            <?php if ($message): ?>
            <div class="mb-8 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 <?php echo strpos($message, 'Error') !== false ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'; ?> animate-in fade-in slide-in-from-top-4 duration-500">
                <div class="w-8 h-8 rounded-xl <?php echo strpos($message, 'Error') !== false ? 'bg-red-100' : 'bg-emerald-100'; ?> flex items-center justify-center flex-shrink-0">
                    <?php if (strpos($message, 'Error') !== false): ?>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    <?php
    else: ?>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                    <?php
    endif; ?>
                </div>
                <?php echo $message; ?>
            </div>
            <?php
endif; ?>

            <form action="" method="POST">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Whatsapp Section -->
                    <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group">
                        <div class="p-8 border-b border-slate-50 bg-slate-50/10 flex items-center gap-4">
                            <div class="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-black text-slate-900 tracking-tight">WhatsApp / Fonnte</h3>
                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gateway Notifikasi</p>
                            </div>
                        </div>
                        <div class="p-8 space-y-6">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Token API</label>
                                    <input type="text" name="whatsapp_token" value="<?php echo htmlspecialchars($settings['whatsapp_token'] ?? ''); ?>" 
                                        class="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-emerald-500 transition-all outline-none font-bold text-slate-700 text-sm">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instance ID</label>
                                    <input type="text" name="whatsapp_instance_id" value="<?php echo htmlspecialchars($settings['whatsapp_instance_id'] ?? ''); ?>" 
                                        class="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-emerald-500 transition-all outline-none font-bold text-slate-700 text-sm">
                                </div>
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">API Key Alternative</label>
                                <input type="password" name="whatsapp_api_key" value="<?php echo htmlspecialchars($settings['whatsapp_api_key'] ?? ''); ?>" 
                                    class="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-emerald-500 transition-all outline-none font-bold text-slate-700 text-sm">
                            </div>
                        </div>
                    </div>

                    <!-- Cloudinary Section -->
                    <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group">
                        <div class="p-8 border-b border-slate-50 bg-slate-50/10 flex items-center gap-4">
                            <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-black text-slate-900 tracking-tight">Cloudinary</h3>
                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Media Cloud Storage</p>
                            </div>
                        </div>
                        <div class="p-8 space-y-6">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cloud Name</label>
                                    <input type="text" name="cloudinary_cloud_name" value="<?php echo htmlspecialchars($settings['cloudinary_cloud_name'] ?? ''); ?>" 
                                        class="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition-all outline-none font-bold text-slate-700 text-sm">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Folder</label>
                                    <input type="text" name="cloudinary_folder" value="<?php echo htmlspecialchars($settings['cloudinary_folder'] ?? ''); ?>" 
                                        class="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition-all outline-none font-bold text-slate-700 text-sm">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">API Key</label>
                                    <input type="text" name="cloudinary_api_key" value="<?php echo htmlspecialchars($settings['cloudinary_api_key'] ?? ''); ?>" 
                                        class="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition-all outline-none font-bold text-slate-700 text-sm">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">API Secret</label>
                                    <input type="password" name="cloudinary_api_secret" value="<?php echo htmlspecialchars($settings['cloudinary_api_secret'] ?? ''); ?>" 
                                        class="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-blue-500 transition-all outline-none font-bold text-slate-700 text-sm">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Midtrans Section -->
                    <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group">
                        <div class="p-8 border-b border-slate-50 bg-slate-50/10 flex items-center gap-4">
                            <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-black text-slate-900 tracking-tight">Midtrans</h3>
                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gateway Pembayaran</p>
                            </div>
                        </div>
                        <div class="p-8 space-y-6">
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Client Key</label>
                                <input type="text" name="midtrans_client_key" value="<?php echo htmlspecialchars($settings['midtrans_client_key'] ?? ''); ?>" 
                                    class="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 text-sm">
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Server Key</label>
                                <input type="password" name="midtrans_server_key" value="<?php echo htmlspecialchars($settings['midtrans_server_key'] ?? ''); ?>" 
                                    class="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 text-sm">
                            </div>
                            <div class="flex items-center gap-2 pt-2">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="midtrans_is_production" value="true" <?php echo($settings['midtrans_is_production'] ?? '') === 'true' ? 'checked' : ''; ?> class="sr-only peer">
                                    <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Production Mode</span>
                            </div>
                        </div>
                    </div>

                    <!-- Intelligence & Maps Section -->
                    <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group">
                        <div class="p-8 border-b border-slate-50 bg-slate-50/10 flex items-center gap-4">
                            <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-black text-slate-900 tracking-tight">AI & Maps</h3>
                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vision & Geospatial</p>
                            </div>
                        </div>
                        <div class="p-8 space-y-6">
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Google Cloud Vision Key</label>
                                <input type="password" name="google_cloud_vision_key" value="<?php echo htmlspecialchars($settings['google_cloud_vision_key'] ?? ''); ?>" 
                                    class="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-amber-500 transition-all outline-none font-bold text-slate-700 text-sm">
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Google Maps API Key</label>
                                <input type="password" name="google_maps_api_key" value="<?php echo htmlspecialchars($settings['google_maps_api_key'] ?? ''); ?>" 
                                    class="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-amber-500 transition-all outline-none font-bold text-slate-700 text-sm">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-12 flex justify-center">
                    <button type="submit" class="bg-slate-900 hover:bg-black text-white px-12 py-5 rounded-[2rem] font-black text-sm tracking-widest uppercase transition-all shadow-2xl shadow-slate-200 active:scale-95 flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                        Simpan Semua Pengaturan
                    </button>
                </div>
            </form>
        </div>
    </main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
