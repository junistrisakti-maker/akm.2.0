<?php
require_once __DIR__ . '/auth/check-session.php';
require_once __DIR__ . '/../api/config.php';

try {
    $backsounds = $pdo->query("SELECT * FROM backsounds ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
}
catch (PDOException $e) {
    die("Database Error: " . $e->getMessage());
}

$page_title = 'Vibes Music Management';
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="flex-1 lg:ml-64 flex flex-col min-h-screen">
    <main class="p-8 lg:p-12">
        <?php require_once __DIR__ . '/includes/navbar.php'; ?>

        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
                <h2 class="text-2xl font-black text-slate-900 tracking-tight">Audio Playlist & Vibes</h2>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Kelola musik latar untuk Share the Moment</p>
                
                <!-- New Feature Alert -->
                <div class="mt-6 p-4 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-3xl shadow-xl shadow-emerald-100 flex items-center justify-between border border-emerald-400 group">
                    <div class="flex items-center gap-4 text-white">
                        <div class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <div>
                            <p class="font-black text-sm tracking-tight leading-none uppercase italic opacity-70 mb-1">Terbaru!</p>
                            <h4 class="font-black text-lg">Precision Audio Trimmer V2</h4>
                            <p class="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Gunakan trimmer visual dengan penanda waktu 1:1</p>
                        </div>
                    </div>
                    <a href="http://localhost:5174/vibes-music" target="_blank" class="bg-white text-emerald-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-2">
                        Buka Trimmer Sekarang
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                </div>
            </div>
            <button onclick="document.getElementById('uploadModal').classList.remove('hidden')" class="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-4 rounded-2xl shadow-xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Unggah Vibe Baru
            </button>
        </div>

        <!-- Vibe List Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <?php foreach ($backsounds as $vibe): ?>
            <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl hover:shadow-emerald-100/30 transition-all duration-500">
                <div class="p-8 pb-4">
                    <div class="flex items-start justify-between mb-6">
                        <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-black uppercase tracking-widest <?php echo $vibe['is_active'] ? 'text-emerald-600' : 'text-slate-300'; ?>">
                                <?php echo $vibe['is_active'] ? 'Aktif' : 'Nonaktif'; ?>
                            </span>
                            <div class="w-2 h-2 rounded-full <?php echo $vibe['is_active'] ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'; ?>"></div>
                        </div>
                    </div>
                    
                    <h3 class="text-xl font-black text-slate-900 truncate mb-1"><?php echo $vibe['name']; ?></h3>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: #<?php echo $vibe['id']; ?> &bull; Cloudinary Path</p>
                </div>

                <!-- Audio Preview (Fake Visual) -->
                <div class="px-8 mb-6">
                    <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4 group-hover:bg-white group-hover:border-emerald-100 transition-all">
                        <button onclick="togglePreview('<?php echo $vibe['url']; ?>', this)" class="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        <div class="flex-1 space-y-1">
                            <div class="h-1 bg-slate-200 rounded-full overflow-hidden">
                                <div class="h-full bg-emerald-500 w-0 transition-all duration-300"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="px-8 pb-8 flex items-center justify-between border-t border-slate-50 pt-6">
                    <div class="flex items-center gap-3">
                        <button onclick="toggleVibe(<?php echo $vibe['id']; ?>)" class="bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 p-3 rounded-xl border border-transparent hover:border-emerald-100 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                        <button onclick="deleteVibe(<?php echo $vibe['id']; ?>)" class="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 p-3 rounded-xl border border-transparent hover:border-red-100 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                    <span class="text-[10px] font-black text-slate-300 italic"><?php echo date('d/m/y', strtotime($vibe['created_at'])); ?></span>
                </div>
            </div>
            <?php
endforeach; ?>
        </div>
    </main>

    <!-- Upload Modal -->
    <div id="uploadModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center hidden p-4">
        <div class="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 relative animate-in fade-in zoom-in duration-300">
            <button onclick="document.getElementById('uploadModal').classList.add('hidden')" class="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div class="text-center mb-8">
                <div class="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                </div>
                <h3 class="text-2xl font-black text-slate-900 tracking-tight">Unggah Vibe Baru</h3>
                <p class="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Gunakan Cloudinary storage akm</p>
            </div>

            <form id="uploadForm" class="space-y-6">
                <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Vibe</label>
                    <input type="text" name="name" required placeholder="Contoh: Magrib Chill Vibe" class="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-500 transition-all outline-none font-bold text-slate-700">
                </div>

                <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">File Audio (MP3/WAV)</label>
                    <div class="relative">
                        <input type="file" name="audio" accept=".mp3,.wav,.ogg,.m4a" required class="hidden" id="vibeInput" onchange="updateFileName(this)">
                        <label for="vibeInput" class="w-full flex items-center justify-center gap-3 px-6 py-8 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/20 transition-all text-slate-400 font-bold text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span id="fileNameDisplay">Pilih file audio...</span>
                        </label>
                    </div>
                </div>

                <div class="pt-4">
                    <button type="submit" id="submitBtn" class="w-full bg-emerald-600 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.2em] text-xs">
                        Mulai Unggah Sekarang
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
let currentAudio = null;

function updateFileName(input) {
    const display = document.getElementById('fileNameDisplay');
    if (input.files.length > 0) {
        display.textContent = input.files[0].name;
        display.classList.add('text-emerald-600');
    }
}

function togglePreview(url, btn) {
    if (currentAudio && currentAudio.src === url) {
        if (currentAudio.paused) {
            currentAudio.play();
            btn.classList.add('text-emerald-600');
        } else {
            currentAudio.pause();
            btn.classList.remove('text-emerald-600');
        }
    } else {
        if (currentAudio) currentAudio.pause();
        currentAudio = new Audio(url);
        currentAudio.play();
        btn.classList.add('text-emerald-600');
    }
}

document.getElementById('uploadForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const formData = new FormData(e.target);
    
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-pulse">Sedang Mengirim ke Cloudinary...</span>';
    
    try {
        const res = await fetch('api/vibe_upload.php', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if (data.success) {
            alert(data.message);
            location.reload();
        } else {
            alert('Error: ' + data.error);
            btn.disabled = false;
            btn.textContent = 'Mulai Unggah Sekarang';
        }
    } catch (err) {
        alert('Terjadi kesalahan jaringan.');
        btn.disabled = false;
        btn.textContent = 'Mulai Unggah Sekarang';
    }
};

async function toggleVibe(id) {
    if (!confirm('Ubah status aktif vibe ini?')) return;
    try {
        const res = await fetch('api/vibe_toggle.php?id=' + id);
        const data = await res.json();
        if (data.success) location.reload();
    } catch (err) {
        alert('Gagal mengubah status.');
    }
}

async function deleteVibe(id) {
    if (!confirm('Hapus vibe ini secara permanen?')) return;
    try {
        const res = await fetch('api/vibe_delete.php?id=' + id);
        const data = await res.json();
        if (data.success) location.reload();
        else alert('Error: ' + data.error);
    } catch (err) {
        alert('Gagal menghapus vibe.');
    }
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
