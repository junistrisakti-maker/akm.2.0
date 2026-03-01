<?php
require_once __DIR__ . '/auth/check-session.php';
require_once __DIR__ . '/../api/config.php';

$page_title = 'Program Donasi';

try {
    // Stats
    $total_amount = $pdo->query("SELECT SUM(amount) FROM donations")->fetchColumn() ?: 0;
    $total_cnt = $pdo->query("SELECT COUNT(*) FROM donations")->fetchColumn() ?: 0;

    // Latest donations
    $stmt = $pdo->query("SELECT * FROM donations ORDER BY created_at DESC");
    $donations = $stmt->fetchAll(PDO::FETCH_ASSOC);

}
catch (PDOException $e) {
    die("Database Error: " . $e->getMessage());
}

function formatRupiah($angka)
{
    return "Rp " . number_format($angka, 0, ',', '.');
}

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<main class="flex-1 lg:ml-64 p-8">
    <?php require_once __DIR__ . '/includes/navbar.php'; ?>

    <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Monitoring Donasi</h1>
            <p class="text-sm text-slate-500 font-medium mt-1">Transparansi dana masuk dari jemaah untuk seluruh masjid.</p>
        </div>
        
        <div class="bg-emerald-600 px-8 py-5 rounded-[2rem] shadow-xl shadow-emerald-200 text-white relative overflow-hidden group">
            <div class="relative z-10">
                <p class="text-[10px] font-black uppercase tracking-widest text-emerald-100 opacity-80">Total Terkumpul</p>
                <h3 class="text-3xl font-black mt-1"><?php echo formatRupiah($total_amount); ?></h3>
            </div>
            <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        </div>
    </div>

    <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div class="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h2 class="text-lg font-black text-slate-900 tracking-tight">Riwayat Transaksi</h2>
            <span class="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black"><?php echo $total_cnt; ?> Transaksi</span>
        </div>
        
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead class="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <tr>
                        <th class="px-8 py-5">Donatur</th>
                        <th class="px-8 py-5">Jumlah</th>
                        <th class="px-8 py-5">Pesan</th>
                        <th class="px-8 py-5 text-right">Waktu</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <?php if (empty($donations)): ?>
                        <tr>
                            <td colspan="4" class="px-8 py-12 text-center text-slate-400 font-medium italic">Belum ada donasi yang masuk...</td>
                        </tr>
                    <?php
else: ?>
                        <?php foreach ($donations as $donation): ?>
                        <tr class="hover:bg-slate-50 transition-colors group">
                            <td class="px-8 py-5">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <span class="font-bold text-slate-800 text-sm tracking-tight"><?php echo htmlspecialchars($donation['donor_name']); ?></span>
                                </div>
                            </td>
                            <td class="px-8 py-5 font-black text-emerald-600 text-sm italic"><?php echo formatRupiah($donation['amount']); ?></td>
                            <td class="px-8 py-5">
                                <span class="text-slate-500 text-xs italic font-medium">"<?php echo htmlspecialchars($donation['message'] ?: '-'); ?>"</span>
                            </td>
                            <td class="px-8 py-5 text-right">
                                <span class="text-slate-400 text-[10px] font-bold uppercase tracking-widest"><?php echo date('d M Y, H:i', strtotime($donation['created_at'])); ?></span>
                            </td>
                        </tr>
                        <?php
    endforeach; ?>
                    <?php
endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
