<?php
require_once __DIR__ . '/auth/check-session.php';
require_once __DIR__ . '/../api/config.php';

$page_title = 'Kelola Challenges';

try {
    $stmt = $pdo->query("SELECT * FROM challenges ORDER BY created_at DESC");
    $challenges = $stmt->fetchAll(PDO::FETCH_ASSOC);

}
catch (PDOException $e) {
    die("Database Error: " . $e->getMessage());
}

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<main class="flex-1 lg:ml-64 p-8">
    <?php require_once __DIR__ . '/includes/navbar.php'; ?>

    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Challenges & Gamifikasi</h1>
            <p class="text-sm text-slate-500 font-medium mt-1">Buat tantangan seru untuk meningkatkan interaksi jemaah di masjid.</p>
        </div>
        <div>
            <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Challenge Baru
            </button>
        </div>
    </div>

    <?php if (empty($challenges)): ?>
        <!-- Empty State with a bit more flair -->
        <div class="bg-white rounded-[3rem] p-16 text-center border border-slate-100 shadow-sm relative overflow-hidden">
            <div class="absolute -top-10 -left-10 w-40 h-40 bg-indigo-50 rounded-full opacity-50 blur-3xl"></div>
            <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-50 rounded-full opacity-50 blur-3xl"></div>
            
            <div class="relative z-10 text-6xl mb-6">🏆</div>
            <h2 class="text-2xl font-black text-slate-900 mb-2 mt-4">Belum ada Challenge aktif</h2>
            <p class="text-slate-500 max-w-sm mx-auto mb-8 font-medium">Ayo buat tantangan pertama agar ekosistem digital masjid makin hidup!</p>
            
            <button class="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                🚀 Mulai Buat Challenge
            </button>
        </div>
    <?php
else: ?>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <?php foreach ($challenges as $challenge): ?>
                <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 flex flex-col group hover:shadow-xl transition-all duration-500 border-b-4 border-b-indigo-500">
                    <div class="flex justify-between items-start mb-6">
                        <div class="text-4xl bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm">
                            <?php echo $challenge['badge_icon']; ?>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                <?php echo $challenge['type']; ?>
                            </span>
                            <span class="text-[10px] text-slate-400 font-bold mt-2 italic"><?php echo $challenge['points']; ?> PTS</span>
                        </div>
                    </div>

                    <h3 class="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors"><?php echo htmlspecialchars($challenge['title']); ?></h3>
                    <p class="text-slate-500 text-xs mt-2 leading-relaxed font-medium line-clamp-3">
                        <?php echo htmlspecialchars($challenge['description']); ?>
                    </p>

                    <div class="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div class="flex -space-x-2">
                            <!-- Dummy participants -->
                            <img class="w-7 h-7 rounded-full border-2 border-white bg-slate-100" src="https://ui-avatars.com/api/?name=A">
                            <img class="w-7 h-7 rounded-full border-2 border-white bg-slate-100" src="https://ui-avatars.com/api/?name=B">
                            <img class="w-7 h-7 rounded-full border-2 border-white bg-slate-100" src="https://ui-avatars.com/api/?name=C">
                            <div class="w-7 h-7 rounded-full border-2 border-white bg-slate-900 text-[8px] font-bold text-white flex items-center justify-center">+12</div>
                        </div>
                        
                        <div class="flex gap-2">
                            <button class="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <button class="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            <?php
    endforeach; ?>
        </div>
    <?php
endif; ?>
</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
