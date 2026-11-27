// --- PHẦN 1: XỬ LÝ TRUYỆN MP3 & THƯ MỤC ---
const folderUpload = document.getElementById('folder-upload');
const audioUpload = document.getElementById('audio-upload');
const storyPlayer = document.getElementById('story-player');
const playlistEl = document.getElementById('playlist');
const currentTitleEl = document.getElementById('current-story-title');
const speedSelect = document.getElementById('playback-speed');

let storyFiles = [];
let currentIndex = 0;

const savedSpeed = localStorage.getItem('story_speed');
if (savedSpeed) speedSelect.value = savedSpeed;

// Hàm dùng chung xử lý cả khi chọn thư mục lẫn khi chọn nhiều file
function handleFilesSelected(e) {
    const rawFiles = Array.from(e.target.files);
    if (rawFiles.length === 0) return;

    // Chỉ giữ lại các file âm thanh (mp3, m4a, wav, ogg...), bỏ qua ảnh/txt nếu có trong thư mục
    const audioFiles = rawFiles.filter(file => 
        file.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(file.name)
    );

    if (audioFiles.length === 0) {
        alert('Không tìm thấy file âm thanh (.mp3) nào trong thư mục này!');
        return;
    }

    // Sắp xếp theo thứ tự tự nhiên (Chương 1, Chương 2, ..., Chương 10)
    audioFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    storyFiles = audioFiles;

    // Khôi phục chương đang nghe dở trước đó nếu trùng tên
    const lastPlayedName = localStorage.getItem('last_story_name');
    const foundIndex = storyFiles.findIndex(f => f.name === lastPlayedName);
    
    renderPlaylist();
    playStory(foundIndex !== -1 ? foundIndex : 0);
}

folderUpload.addEventListener('change', handleFilesSelected);
audioUpload.addEventListener('change', handleFilesSelected);

function renderPlaylist() {
    playlistEl.innerHTML = '';
    storyFiles.forEach((file, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${file.name}`;
        if (index === currentIndex) li.classList.add('active');
        
        li.addEventListener('click', () => playStory(index));
        playlistEl.appendChild(li);
    });

    // Tự động cuộn danh sách tới chương đang phát
    const activeItem = playlistEl.querySelector('.active');
    if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function playStory(index) {
    if (index < 0 || index >= storyFiles.length) return;
    
    currentIndex = index;
    const file = storyFiles[index];
    const fileURL = URL.createObjectURL(file);
    
    storyPlayer.src = fileURL;
    storyPlayer.playbackRate = parseFloat(speedSelect.value);
    
    localStorage.setItem('last_story_name', file.name);

    const savedTime = localStorage.getItem('progress_' + file.name);
    if (savedTime) {
        storyPlayer.currentTime = parseFloat(savedTime);
    }

    storyPlayer.play();
    currentTitleEl.textContent = `Đang phát (${index + 1}/${storyFiles.length}): ${file.name}`;
    renderPlaylist();
}

storyPlayer.addEventListener('timeupdate', () => {
    if (storyFiles[currentIndex] && !storyPlayer.paused) {
        const fileName = storyFiles[currentIndex].name;
        localStorage.setItem('progress_' + fileName, storyPlayer.currentTime);
    }
});

storyPlayer.addEventListener('ended', () => {
    if (storyFiles[currentIndex]) {
        localStorage.removeItem('progress_' + storyFiles[currentIndex].name);
    }
    if (currentIndex + 1 < storyFiles.length) {
        playStory(currentIndex + 1);
    }
});

speedSelect.addEventListener('change', () => {
    storyPlayer.playbackRate = parseFloat(speedSelect.value);
    localStorage.setItem('story_speed', speedSelect.value);
});


// --- PHẦN 2: XỬ LÝ NHẠC NỀN YOUTUBE ---
let ytPlayer;

function onYouTubeIframeAPIReady() {
    const savedVideoId = localStorage.getItem('last_yt_id') || 'jfKfPfyJRdk';
    const savedVol = localStorage.getItem('yt_volume') || 30;

    document.getElementById('yt-volume').value = savedVol;
    document.getElementById('vol-value').textContent = savedVol;

    ytPlayer = new YT.Player('youtube-player', {
        height: '315',
        width: '560',
        videoId: savedVideoId,
        playerVars: {
            'playsinline': 1,
            'loop': 1,
            'playlist': savedVideoId
        },
        events: {
            'onReady': (event) => {
                event.target.setVolume(parseInt(savedVol));
            }
        }
    });
}

function extractVideoID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

document.getElementById('load-yt-btn').addEventListener('click', () => {
    const url = document.getElementById('yt-url').value.trim();
    const videoId = extractVideoID(url);
    
    if (videoId && ytPlayer) {
        ytPlayer.loadVideoById(videoId);
        localStorage.setItem('last_yt_id', videoId);
    } else {
        alert('Link YouTube không hợp lệ. Vui lòng kiểm tra lại!');
    }
});

const ytVolumeSlider = document.getElementById('yt-volume');
const volValueEl = document.getElementById('vol-value');

ytVolumeSlider.addEventListener('input', (e) => {
    const vol = e.target.value;
    volValueEl.textContent = vol;
    localStorage.setItem('yt_volume', vol);
    if (ytPlayer && ytPlayer.setVolume) {
        ytPlayer.setVolume(vol);
    }
});