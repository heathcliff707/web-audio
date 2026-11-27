// --- PHẦN 1: XỬ LÝ TRUYỆN MP3 ---
const audioUpload = document.getElementById('audio-upload');
const storyPlayer = document.getElementById('story-player');
const playlistEl = document.getElementById('playlist');
const currentTitleEl = document.getElementById('current-story-title');
const speedSelect = document.getElementById('playback-speed');

let storyFiles = [];
let currentIndex = 0;

// Khi người dùng chọn file từ máy
audioUpload.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Sắp xếp tên file theo thứ tự tự nhiên (Chương 1, Chương 2, Chương 10...)
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    
    storyFiles = files;
    renderPlaylist();
    playStory(0);
});

// Hiển thị danh sách chương
function renderPlaylist() {
    playlistEl.innerHTML = '';
    storyFiles.forEach((file, index) => {
        const li = document.createElement('li');
        li.textContent = file.name;
        if (index === currentIndex) li.classList.add('active');
        
        li.addEventListener('click', () => playStory(index));
        playlistEl.appendChild(li);
    });
}

// Phát file tại vị trí index
function playStory(index) {
    if (index < 0 || index >= storyFiles.length) return;
    
    currentIndex = index;
    const file = storyFiles[index];
    const fileURL = URL.createObjectURL(file);
    
    storyPlayer.src = fileURL;
    storyPlayer.playbackRate = parseFloat(speedSelect.value);
    storyPlayer.play();
    
    currentTitleEl.textContent = `Đang phát: ${file.name}`;
    renderPlaylist();
}

// Tự động chuyển chương tiếp theo khi hết bài
storyPlayer.addEventListener('ended', () => {
    if (currentIndex + 1 < storyFiles.length) {
        playStory(currentIndex + 1);
    }
});

// Thay đổi tốc độ đọc
speedSelect.addEventListener('change', () => {
    storyPlayer.playbackRate = parseFloat(speedSelect.value);
});


// --- PHẦN 2: XỬ LÝ NHẠC NỀN YOUTUBE ---
let ytPlayer;

// Hàm này được thư viện YouTube API tự động gọi khi tải xong
function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('youtube-player', {
        height: '315',
        width: '560',
        videoId: 'jfKfPfyJRdk', // Mặc định phát kênh Lofi Girl
        playerVars: {
            'playsinline': 1,
            'loop': 1
        },
        events: {
            'onReady': onPlayerReady
        }
    });
}

function onPlayerReady(event) {
    // Đặt âm lượng nhạc nền mặc định là 30% để không lấn át giọng đọc
    ytPlayer.setVolume(30);
}

// Hàm tách Video ID từ link YouTube bất kỳ
function extractVideoID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Nút tải video YouTube mới
document.getElementById('load-yt-btn').addEventListener('click', () => {
    const url = document.getElementById('yt-url').value.trim();
    const videoId = extractVideoID(url);
    
    if (videoId && ytPlayer) {
        ytPlayer.loadVideoById(videoId);
    } else {
        alert('Link YouTube không hợp lệ. Vui lòng kiểm tra lại!');
    }
});

// Thanh trượt chỉnh âm lượng nhạc nền độc lập
const ytVolumeSlider = document.getElementById('yt-volume');
const volValueEl = document.getElementById('vol-value');

ytVolumeSlider.addEventListener('input', (e) => {
    const vol = e.target.value;
    volValueEl.textContent = vol;
    if (ytPlayer && ytPlayer.setVolume) {
        ytPlayer.setVolume(vol);
    }
});