<?php
require_once __DIR__ . '/auth/check-session.php';
require_once __DIR__ . '/../api/config.php';

$page_title = 'UGC Moderasi';

try {
    // Fetch pending posts with user info
    $stmt = $pdo->prepare("
        SELECT p.*, u.username, u.avatar as user_avatar 
        FROM posts p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.status = 'pending' 
        ORDER BY p.created_at ASC
    ");
    $stmt->execute();
    $pending_posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

}
catch (PDOException $e) {
    die("Database Error: " . $e->getMessage());
}

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<main class="flex-1 lg:ml-64 p-8">
    <?php require_once __DIR__ . '/includes/navbar.php'; ?>

    <div class="mb-8">
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">Moderasi Konten</h1>
        <p class="text-sm text-slate-500 font-medium mt-1">Review postingan jemaah sebelum dipublikasikan ke feed utama.</p>
    </div>

    <?php if (empty($pending_posts)): ?>
        <div class="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm">
            <div class="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">Semua Bersih!</h2>
            <p class="text-slate-500 max-w-xs mx-auto">Tidak ada postingan yang menunggu moderasi saat ini. Kerja bagus, Admin!</p>
        </div>
    <?php
else: ?>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <?php foreach ($pending_posts as $post): ?>
                <div id="post-card-<?php echo $post['id']; ?>" class="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
                    <!-- Post Header -->
                    <div class="p-5 flex items-center gap-3 border-b border-slate-50">
                        <img src="<?php echo $post['user_avatar'] ?: 'https://ui-avatars.com/api/?name=' . $post['username']; ?>" class="w-10 h-10 rounded-xl object-cover bg-slate-100">
                        <div>
                            <span class="font-bold text-slate-900 text-sm tracking-tight block">@<?php echo htmlspecialchars($post['username']); ?></span>
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest"><?php echo date('d M Y, H:i', strtotime($post['created_at'])); ?></span>
                        </div>
                    </div>

                    <!-- Post Media -->
                    <div class="aspect-square bg-slate-100 relative overflow-hidden">
                        <?php if ($post['type'] === 'image'): ?>
                            <img src="<?php echo $post['url']; ?>" class="w-full h-full object-cover">
                        <?php
        else: ?>
                            <video src="<?php echo $post['url']; ?>" class="w-full h-full object-cover" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>
                            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div class="w-12 h-12 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            </div>
                        <?php
        endif; ?>
                    </div>

                    <!-- Post Caption -->
                    <div class="p-5 flex-1">
                        <p class="text-slate-700 text-sm leading-relaxed italic">
                            "<?php echo htmlspecialchars($post['caption']); ?>"
                        </p>
                        <?php if ($post['location_name']): ?>
                            <div class="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <?php echo htmlspecialchars($post['location_name']); ?>
                            </div>
                        <?php
        endif; ?>
                    </div>

                    <!-- Post Actions -->
                    <div class="p-5 pt-0 grid grid-cols-2 gap-3">
                        <button onclick="moderatePost(<?php echo $post['id']; ?>, 'reject')" class="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-600 hover:text-white transition-all border border-red-100">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Tolak
                        </button>
                        <button onclick="moderatePost(<?php echo $post['id']; ?>, 'approve')" class="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Terima
                        </button>
                    </div>
                </div>
            <?php
    endforeach; ?>
        </div>
    <?php
endif; ?>
</main>

<script>
async function moderatePost(postId, action) {
    if (!confirm(`Yakin ingin ${action === 'approve' ? 'menyetujui' : 'menolak'} postingan ini?`)) return;

    const formData = new FormData();
    formData.append('post_id', postId);
    formData.append('action', action);

    try {
        const response = await fetch('api/moderate_post.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            const card = document.getElementById(`post-card-${postId}`);
            card.style.transform = 'scale(0.8)';
            card.style.opacity = '0';
            setTimeout(() => {
                card.remove();
                if (document.querySelectorAll('[id^="post-card-"]').length === 0) {
                    window.location.reload();
                }
            }, 300);
        } else {
            alert('Gagal: ' + result.error);
        }
    } catch (error) {
        alert('Terjadi kesalahan koneksi.');
    }
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
