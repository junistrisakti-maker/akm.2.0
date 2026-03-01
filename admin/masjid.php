<?php
require_once __DIR__ . '/auth/check-session.php';
require_once __DIR__ . '/../api/config.php';

$page_title = 'Kelola Masjid';
$search = $_GET['search'] ?? '';

try {
    $query = "SELECT * FROM mosques";
    $params = [];

    if ($search) {
        $query .= " WHERE name LIKE ? OR address LIKE ?";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    $query .= " ORDER BY id DESC";
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $masjids = $stmt->fetchAll(PDO::FETCH_ASSOC);

}
catch (PDOException $e) {
    die("Database Error: " . $e->getMessage());
}

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<main class="flex-1 lg:ml-64 p-8">
    <?php require_once __DIR__ . '/includes/navbar.php'; ?>

    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Daftar Masjid</h1>
            <p class="text-sm text-slate-500 font-medium mt-1">Total: <?php echo count($masjids); ?> Masjid terdaftar</p>
        </div>
        <div class="flex items-center gap-3">
            <button class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Tambah Masjid
            </button>
        </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <form action="" method="GET" class="flex flex-col md:flex-row gap-4">
            <div class="relative flex-1">
                <input type="text" name="search" value="<?php echo htmlspecialchars($search); ?>" 
                    placeholder="Cari nama atau lokasi masjid..." 
                    class="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
            <button type="submit" class="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all">Filter</button>
            <?php if ($search): ?>
                <a href="masjid.php" class="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all text-center">Reset</a>
            <?php
endif; ?>
        </form>
    </div>

    <!-- Table Section -->
    <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead class="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <tr>
                        <th class="px-8 py-5">Masjid</th>
                        <th class="px-8 py-5">Alamat</th>
                        <th class="px-8 py-5 text-center">Rating</th>
                        <th class="px-8 py-5">Status</th>
                        <th class="px-8 py-5 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <?php if (empty($masjids)): ?>
                        <tr>
                            <td colspan="5" class="px-8 py-10 text-center text-slate-400 font-medium">Buset, gak ada masjidnya nih...</td>
                        </tr>
                    <?php
else: ?>
                        <?php foreach ($masjids as $masjid): ?>
                        <tr class="hover:bg-slate-50/50 transition-all duration-200 group">
                            <td class="px-8 py-5">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm border border-emerald-100/50">
                                        <?php echo strtoupper(substr($masjid['name'], 0, 1)); ?>
                                    </div>
                                    <div>
                                        <span class="font-bold text-slate-900 text-sm tracking-tight block group-hover:text-emerald-600 transition-colors"><?php echo $masjid['name']; ?></span>
                                        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">ID: #MSJ-<?php echo str_pad($masjid['id'], 3, '0', STR_PAD_LEFT); ?></span>
                                    </div>
                                </div>
                            </td>
                            <td class="px-8 py-5">
                                <span class="text-slate-500 text-xs font-medium bg-slate-100/50 px-3 py-1.5 rounded-lg inline-block max-w-[200px] truncate"><?php echo $masjid['address']; ?></span>
                            </td>
                            <td class="px-8 py-5 text-center">
                                <div class="inline-flex items-center gap-1.5 text-yellow-500 bg-yellow-50 px-3 py-1 rounded-xl border border-yellow-100/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 fill-current" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span class="text-xs font-black tracking-tight"><?php echo number_format($masjid['rating'], 1); ?></span>
                                </div>
                            </td>
                            <td class="px-8 py-5">
                                <div class="flex items-center gap-1.5 animate-pulse">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    <span class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Aktif</span>
                                </div>
                            </td>
                            <td class="px-8 py-5 text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-100 transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <?php
    endforeach; ?>
                    <?php
endif; ?>
                </tbody>
            </table>
        </div>
        <!-- Pagination Placeholder -->
        <div class="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <span class="text-xs text-slate-400 font-bold">Showing 1 to <?php echo count($masjids); ?> of <?php echo count($masjids); ?> mosques</span>
            <div class="flex gap-2">
                <button class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-400 cursor-not-allowed">Prev</button>
                <button class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-400 cursor-not-allowed">Next</button>
            </div>
        </div>
    </div>
</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
