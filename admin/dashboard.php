<?php
require_once __DIR__ . '/auth/check-session.php';
require_once __DIR__ . '/../api/config.php';

try {
    // 1. Stats Query
    // Total Masjid
    $totalMasjid = $pdo->query("SELECT COUNT(*) FROM mosques")->fetchColumn();

    // Total Donasi (Sum amount from donations)
    $totalDonasi = $pdo->query("SELECT SUM(amount) FROM donations")->fetchColumn();
    if (!$totalDonasi)
        $totalDonasi = 0;

    // UGC Pending (Posts with status 'pending')
    // Note: Checking the correct table 'posts' which I saw in the file earlier.
    $ugcPending = $pdo->query("SELECT COUNT(*) FROM posts WHERE status = 'pending'")->fetchColumn();

    // 2. Latest Masjid for Table
    $latestMasjid = $pdo->query("SELECT * FROM mosques ORDER BY created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

}
catch (PDOException $e) {
    // Log error and show a nice message
    error_log("Dashboard Data Error: " . $e->getMessage());
    $totalMasjid = 0;
    $totalDonasi = 0;
    $ugcPending = 0;
    $latestMasjid = [];
    $db_error = true;
}

function formatRupiah($angka)
{
    return "Rp " . number_format($angka, 0, ',', '.');
}

$page_title = 'Dashboard Overview';
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<!-- Main Content Wrapper -->
<div class="flex-1 lg:ml-64 flex flex-col min-h-screen">
    <main class="p-8 lg:p-12">
        <?php require_once __DIR__ . '/includes/navbar.php'; ?>

        <?php if (isset($db_error)): ?>
            <div class="bg-red-50 border border-red-100 text-red-600 p-4 rounded-3xl mb-8 font-bold text-sm flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                Terjadi kesalahan saat memuat data dari database. Silakan hubungi tim IT.
            </div>
        <?php
endif; ?>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <!-- Total Masjid Card -->
            <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl hover:shadow-emerald-100/50 hover:-translate-y-1 transition-all duration-300">
                <div class="flex items-start justify-between mb-8">
                    <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                </div>
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Masjid</p>
                    <div class="flex items-baseline gap-2">
                        <h3 class="text-4xl font-black text-slate-900 tracking-tighter"><?php echo $totalMasjid; ?></h3>
                        <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">Aktif</span>
                    </div>
                </div>
            </div>

            <!-- Total Donasi Card -->
            <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl hover:shadow-blue-100/50 hover:-translate-y-1 transition-all duration-300">
                <div class="flex items-start justify-between mb-8">
                    <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Donasi</p>
                    <div class="flex items-baseline gap-2">
                        <h3 class="text-3xl font-black text-slate-900 tracking-tighter"><?php echo formatRupiah($totalDonasi); ?></h3>
                    </div>
                </div>
            </div>

            <!-- UGC Pending Card -->
            <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-2xl hover:shadow-orange-100/50 hover:-translate-y-1 transition-all duration-300">
                <div class="flex items-start justify-between mb-8">
                    <div class="w-14 h-14 <?php echo $ugcPending > 0 ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' : 'bg-slate-50 text-slate-400'; ?> rounded-2xl flex items-center justify-center transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <?php if ($ugcPending > 0): ?>
                        <div class="flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 animate-pulse">
                            <span class="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                            <span class="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none">High Priority</span>
                        </div>
                    <?php
endif; ?>
                </div>
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">UGC Pending</p>
                    <div class="flex items-baseline gap-2">
                        <h3 class="text-4xl font-black <?php echo $ugcPending > 0 ? 'text-orange-600' : 'text-slate-900'; ?> tracking-tighter"><?php echo $ugcPending; ?></h3>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Postingan</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Latest Table Section -->
        <div class="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
            <div class="px-10 py-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center bg-slate-50/20 gap-4">
                <div>
                    <h2 class="text-xl font-black text-slate-900 tracking-tight">Masjid Terbaru</h2>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Status dan pendaftaran terakhir</p>
                </div>
                <a href="masjid.php" class="inline-flex items-center gap-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95">
                    Lihat Semua Data
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </a>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                        <tr>
                            <th class="px-10 py-6">Nama Masjid</th>
                            <th class="px-10 py-6">Alamat Utama</th>
                            <th class="px-10 py-6 text-center">Rating</th>
                            <th class="px-10 py-6">Status</th>
                            <th class="px-10 py-6 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        <?php if (empty($latestMasjid)): ?>
                            <tr>
                                <td colspan="5" class="px-10 py-20 text-center">
                                    <div class="flex flex-col items-center gap-4">
                                        <div class="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                        </div>
                                        <p class="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum ada data masjid</p>
                                    </div>
                                </td>
                            </tr>
                        <?php
else: ?>
                            <?php foreach ($latestMasjid as $masjid): ?>
                            <tr class="hover:bg-emerald-50/10 transition-all duration-300 group">
                                <td class="px-10 py-6">
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-emerald-100 transition-all">
                                            <span class="text-xs font-black text-slate-400 group-hover:text-emerald-600"><?php echo strtoupper(substr($masjid['name'], 0, 1)); ?></span>
                                        </div>
                                        <div>
                                            <p class="font-black text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tight"><?php echo $masjid['name']; ?></p>
                                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"><?php echo $masjid['category'] ?? 'Masjid Umum'; ?></p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-10 py-6">
                                    <div class="flex items-center gap-2 text-slate-500 max-w-[200px]">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span class="text-xs font-medium truncate"><?php echo explode(',', $masjid['address'])[0]; ?></span>
                                    </div>
                                </td>
                                <td class="px-10 py-6 text-center">
                                    <div class="inline-flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100 text-yellow-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 fill-current" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span class="text-xs font-black tracking-widest"><?php echo number_format($masjid['rating'] ?? 0, 1); ?></span>
                                    </div>
                                </td>
                                <td class="px-10 py-6">
                                    <div class="flex items-center gap-2">
                                        <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                        <span class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Aktif</span>
                                    </div>
                                </td>
                                <td class="px-10 py-6 text-right">
                                    <button class="bg-white p-2 rounded-xl text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-50 hover:border-emerald-100 transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                            <?php
    endforeach; ?>
                        <?php
endif; ?>
                    </tbody>
                </table>
            </div>
            
            <div class="px-10 py-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-50">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none italic">
                    Data sinkronisasi otomatis per 5 detik
                </p>
                <div class="flex gap-2">
                    <button class="w-8 h-8 rounded-lg border border-slate-100 bg-white flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-100 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button class="w-8 h-8 rounded-lg border border-slate-100 bg-white flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-100 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer Space -->
    <footer class="mt-auto py-8 text-center border-t border-slate-100 px-8">
        <p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            AyoKeMasjid &bull; Management Panel V2.0 &bull; Built for Masjid Gen Z
        </p>
    </footer>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
