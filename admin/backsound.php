<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once __DIR__ . '/auth/check-session.php';
require_once __DIR__ . '/../api/config.php';

$page_title = 'Kelola Backsound';
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';

// Fetch current active backsound
$active_url = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'active_backsound_url'")->fetchColumn();
?>

<!-- Wavesurfer.js & Region Plugin -->
<script src="https://unpkg.com/wavesurfer.js@7/dist/wavesurfer.min.js"></script>
<script src="https://unpkg.com/wavesurfer.js@7/dist/plugins/regions.min.js"></script>

<main class="flex-1 lg:ml-64 p-8">
    <?php require_once __DIR__ . '/includes/navbar.php'; ?>

    <div class="max-w-6xl mx-auto">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight">Audio Trimmer & Compressor</h1>
                <p class="text-sm text-slate-500 font-medium mt-1">Upload file besar, potong bagian terbaik, dan aktifkan musik latar.</p>
            </div>
            <div class="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100/50">
                <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span class="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Smart Audio Processing</span>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left: Uploder & Trimmer -->
            <div class="lg:col-span-2 space-y-8">
                <!-- Step 1: Local Upload -->
                <div id="step-upload" class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group">
                    <div class="p-8 border-b border-slate-50 bg-slate-50/10 flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                <span class="font-black text-lg">1</span>
                            </div>
                            <div>
                                <h3 class="text-lg font-black text-slate-900 tracking-tight">Unggah File Sumber</h3>
                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Maksimal 10MB • Lokal Upload</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-8">
                        <div id="drop-zone" class="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group cursor-pointer relative">
                            <input type="file" id="audio-input" class="absolute inset-0 opacity-0 cursor-pointer" accept=".mp3,.ogg,.wav,.m4a">
                            <div class="flex flex-col items-center">
                                <div class="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <h3 class="text-xl font-black text-slate-800" id="file-name">Seret audio ke sini</h3>
                                <p class="text-slate-400 text-sm mt-2 font-medium">Klik untuk memilih file dari komputer Anda</p>
                            </div>
                        </div>

                        <!-- Local Upload Progress -->
                        <div id="local-upload-status" class="mt-8 hidden">
                            <div class="flex justify-between items-center mb-3">
                                <span class="text-xs font-black text-slate-400 uppercase tracking-widest italic animate-pulse">Mengirim ke server lokal...</span>
                                <span id="local-progress-percent" class="text-sm font-black text-emerald-600">0%</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-50">
                                <div id="local-progress-bar" class="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full w-0 transition-all duration-300 shadow-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Visualization & Trimming (Hidden initially) -->
                <div id="step-trim" class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hidden animate-in slide-in-from-bottom-8 duration-700">
                    <div class="p-8 border-b border-slate-50 bg-slate-50/10 flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <span class="font-black text-lg">2</span>
                            </div>
                            <div>
                                <h3 class="text-lg font-black text-slate-900 tracking-tight">Potong & Kompres</h3>
                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pilih Bagian Terbaik • Visual Trimmer</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                             <button id="play-pause" class="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-90">
                                <svg id="play-icon" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                </svg>
                                <svg id="pause-icon" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6" />
                                </svg>
                             </button>
                        </div>
                    </div>

                    <div class="p-8">
                        <div id="waveform" class="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-8"></div>
                        
                        <div class="grid grid-cols-2 gap-8 mb-8">
                            <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Durasi Terpilih</p>
                                <p id="trim-info" class="text-2xl font-black text-indigo-600 tracking-tight">00:00 - 00:00</p>
                                <p class="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">Total: <span id="total-dur">0.0s</span></p>
                            </div>
                            <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center">
                                <p class="text-xs text-slate-400 font-bold text-center leading-relaxed italic">Gunakan kursor untuk menarik area bergaya ungu pada gelombang suara di atas.</p>
                            </div>
                        </div>

                        <button id="process-btn" class="w-full bg-slate-900 hover:bg-black text-white px-12 py-5 rounded-[2rem] font-black text-sm tracking-widest uppercase transition-all shadow-2xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Potong & Aktifkan Sekarang
                        </button>
                    </div>
                </div>
            </div>

            <!-- Right: Status -->
            <div class="space-y-8">
                <div class="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                    <h3 class="text-lg font-black text-slate-900 tracking-tight mb-6">Status Backsound</h3>
                    
                    <?php if ($active_url): ?>
                        <div class="bg-emerald-400 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-100 relative overflow-hidden group mb-6">
                            <div class="absolute -right-6 -bottom-6 opacity-20 group-hover:scale-125 transition-transform duration-700">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                            </div>
                            <p class="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1 italic">Backsound Aktif</p>
                            <h4 class="font-black text-lg tracking-tight mb-4 truncate italic">Live on Cloudinary</h4>
                            <audio src="<?php echo $active_url; ?>" controls class="w-full h-8 custom-audio accent-white"></audio>
                        </div>
                    <?php
else: ?>
                        <div class="bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] p-12 text-center mb-6">
                            <p class="text-slate-400 text-sm font-bold italic">Belum ada audio aktif.</p>
                        </div>
                    <?php
endif; ?>

                    <div class="space-y-4">
                        <div class="flex items-start gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-50 group hover:bg-white hover:border-slate-100 transition-all cursor-default">
                            <div class="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </div>
                            <div>
                                <h5 class="text-xs font-black text-slate-800 tracking-tight">Efisiensi Maksimal</h5>
                                <p class="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">Menggunakan FFmpeg untuk memastikan ukuran file sekecil mungkin tanpa mengurangi kualitas.</p>
                            </div>
                        </div>

                        <div class="flex items-start gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-50 group hover:bg-white hover:border-slate-100 transition-all cursor-default">
                            <div class="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-amber-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h5 class="text-xs font-black text-slate-800 tracking-tight">Tips Trimming</h5>
                                <p class="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">Gunakan durasi stabil (30-60 detik) untuk pengalaman mendengarkan yang nyaman bagi jemaah.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- NEW: Daftar Backsound Section -->
        <div class="mt-12">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h1 class="text-2xl font-black text-slate-900 tracking-tight text-center">Daftar Koleksi Backsound</h1>
                    <p class="text-sm text-slate-500 font-medium mt-1">Daftar semua musik yang pernah Anda unggah ke Cloudinary.</p>
                </div>
            </div>

            <div id="backsound-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Data will be loaded via JS -->
                <div class="col-span-full py-20 text-center animate-pulse">
                    <p class="text-slate-400 font-bold tracking-widest uppercase text-xs">Sedang Mengambil Data...</p>
                </div>
            </div>
        </div>
    </div>
</main>

<style>
    .custom-audio::-webkit-media-controls-enclosure {
        border-radius: 12px;
        background-color: transparent;
    }
</style>

<script>
    let wavesurfer, activeRegion, wsRegions;
    let localUploadedFilename = '';

    const audioInput = document.getElementById('audio-input');
    const fileNameDisplay = document.getElementById('file-name');
    const stepTrim = document.getElementById('step-trim');
    const localStatus = document.getElementById('local-upload-status');
    const localProgressBar = document.getElementById('local-progress-bar');
    const localProgressPercent = document.getElementById('local-progress-percent');
    
    // --- STAGE 1: LOCAL UPLOAD ---
    audioInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) {
                alert('Ukuran file terlalu besar! Maksimal 10MB.');
                return;
            }
            fileNameDisplay.textContent = file.name;
            handleLocalUpload(file);
        }
    };

    function handleLocalUpload(file) {
        localStatus.classList.remove('hidden');
        const formData = new FormData();
        formData.append('audio', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'api/upload_local.php', true);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                localProgressBar.style.width = percent + '%';
                localProgressPercent.textContent = percent + '%';
            }
        };

        xhr.onload = () => {
            const resp = JSON.parse(xhr.responseText);
            if (resp.success) {
                localUploadedFilename = resp.filename;
                initTrimmer(`uploads/temp/${resp.filename}`);
            } else {
                alert('Upload Gagal: ' + resp.error);
            }
        };
        xhr.send(formData);
    }

    // --- STAGE 2: TRIMMER INIT ---
    function initTrimmer(url) {
        stepTrim.classList.remove('hidden');
        stepTrim.scrollIntoView({ behavior: 'smooth' });

        if (wavesurfer) wavesurfer.destroy();

        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#e2e8f0',
            progressColor: '#4f46e5',
            cursorColor: '#4f46e5',
            barWidth: 2,
            barRadius: 3,
            responsive: true,
            height: 120,
        });

        wsRegions = wavesurfer.registerPlugin(WaveSurfer.Regions.create());

        wavesurfer.load(url);

        wavesurfer.on('ready', () => {
            const duration = wavesurfer.getDuration();
            activeRegion = wsRegions.addRegion({
                start: 0,
                end: duration > 30 ? 30 : duration,
                color: 'rgba(79, 70, 229, 0.15)',
                drag: true,
                resize: true,
            });
            updateTrimInfo();
        });

        wsRegions.on('region-updated', (region) => {
            activeRegion = region;
            updateTrimInfo();
        });
    }

    function updateTrimInfo() {
        if (!activeRegion) return;
        const start = activeRegion.start.toFixed(2);
        const end = activeRegion.end.toFixed(2);
        const diff = (activeRegion.end - activeRegion.start).toFixed(1);
        document.getElementById('trim-info').textContent = `${start}s - ${end}s`;
        document.getElementById('total-dur').textContent = `${diff}s`;
    }

    // Playback controls
    document.getElementById('play-pause').onclick = () => {
        wavesurfer.playPause();
        const isPlaying = wavesurfer.isPlaying();
        document.getElementById('play-icon').classList.toggle('hidden', isPlaying);
        document.getElementById('pause-icon').classList.toggle('hidden', !isPlaying);
    };

    // --- STAGE 3: PROCESSING ---
    document.getElementById('process-btn').onclick = async () => {
        if (!activeRegion) return;

        const btn = document.getElementById('process-btn');
        btn.disabled = true;
        btn.innerHTML = `
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sedang Memproses & Mengunggah...
        `;

        const payload = {
            filename: localUploadedFilename,
            start: activeRegion.start,
            duration: activeRegion.end - activeRegion.start
        };

        try {
            const resp = await fetch('api/process_audio_v3.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await resp.json();
            
            if (result.status === 'success') {
                alert(result.message);
                window.location.reload();
            } else {
                alert('Gagal: ' + result.message);
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan sistem.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Potong & Aktifkan Sekarang`;
        }
    };

    // --- STAGE 4: LIST MANAGEMENT ---
    async function loadBacksounds() {
        const listContainer = document.getElementById('backsound-list');
        try {
            const resp = await fetch('api/manage_backsound.php');
            const result = await resp.json();
            
            if (result.success) {
                if (result.data.length === 0) {
                    listContainer.innerHTML = `
                        <div class="col-span-full py-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                            <p class="text-slate-400 font-bold italic">Belum ada koleksi backsound.</p>
                        </div>`;
                    return;
                }

                listContainer.innerHTML = result.data.map(item => `
                    <div class="bg-white rounded-[2rem] p-6 shadow-sm border ${item.is_active == 1 ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-100'} transition-all group relative overflow-hidden">
                        ${item.is_active == 1 ? `
                        <div class="absolute top-4 right-4 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg shadow-emerald-200">
                            Aktif
                        </div>` : ''}
                        
                        <div class="flex items-center gap-4 mb-6">
                            <div class="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                            </div>
                            <div class="overflow-hidden">
                                <h4 class="font-black text-slate-800 tracking-tight truncate">${item.name}</h4>
                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 italic">Cloudinary Asset</p>
                            </div>
                        </div>

                        <audio src="${item.url}" controls class="w-full h-8 mb-6 custom-audio accent-indigo-600"></audio>

                        <div class="flex items-center gap-2">
                            ${item.is_active == 0 ? `
                            <button onclick="activateBacksound(${item.id})" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                                Aktifkan
                            </button>` : `
                            <button disabled class="flex-1 bg-emerald-50 text-emerald-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-default">
                                Sedang Digunakan
                            </button>`}
                            
                            ${item.is_active == 0 ? `
                            <button onclick="deleteBacksound(${item.id})" class="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all border border-slate-100">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>` : ''}
                        </div>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error(err);
            listContainer.innerHTML = `<p class="col-span-full text-center text-rose-500 font-bold">Gagal memuat daftar backsound.</p>`;
        }
    }

    async function activateBacksound(id) {
        if (!confirm('Aktifkan backsound ini sebagai musik latar utama?')) return;
        try {
            const resp = await fetch('api/manage_backsound.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'activate', id })
            });
            const result = await resp.json();
            if (result.success) {
                alert('Backsound berhasil diaktifkan!');
                window.location.reload();
            } else {
                alert('Gagal: ' + result.error);
            }
        } catch (err) {
            alert('Kesalahan sistem.');
        }
    }

    async function deleteBacksound(id) {
        if (!confirm('Hapus audio ini dari koleksi? (Hanya menghapus dari database admin)')) return;
        try {
            const resp = await fetch('api/manage_backsound.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id })
            });
            const result = await resp.json();
            if (result.success) {
                alert('Berhasil dihapus.');
                loadBacksounds();
            } else {
                alert('Gagal: ' + result.error);
            }
        } catch (err) {
            alert('Kesalahan sistem.');
        }
    }

    // Load initial list
    document.addEventListener('DOMContentLoaded', loadBacksounds);
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
