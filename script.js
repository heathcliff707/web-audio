// --- PHẦN 1: XỬ LÝ TRUYỆN MP3 & HIỂN THỊ TIẾN ĐỘ ---
const folderUpload = document.getElementById('folder-upload');
const audioUpload = document.getElementById('audio-upload');
const storyPlayer = document.getElementById('story-player');
const playlistEl = document.getElementById('playlist');
const currentTitleEl = document.getElementById('current-story-title');
const speedSelect = document.getElementById('playback-speed');
const resumeBanner = document.getElementById('resume-banner');
const resumeInfo = document.getElementById('resume-info');

let storyFiles = [];
let currentIndex = 0;

// Hàm đổi số giây thành định dạng Phút:Giây (vd: 125s -> 02:05)
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Kiểm tra và hiển thị lịch sử ngay khi vừa mở web
function checkSavedProgress() {
    const lastStory = localStorage.getItem('last_story_name');
    if (lastStory) {
        const savedSec = parseFloat(localStorage.getItem('progress_' + lastStory)) || 0;
        resumeBanner.style.display = 'block';
        resumeInfo.textContent = `${lastStory} (tại ${formatTime(savedSec)}) — Hãy chọn lại thư mục truyện để nghe tiếp`;
    }
}
checkSavedProgress();

const savedSpeed = localStorage.getItem('story_speed');
if (savedSpeed) speedSelect.value = savedSpeed;

function handleFilesSelected(e) {
    const rawFiles = Array.from(e.target.files);
    if (rawFiles.length === 0) return;

    const audioFiles = rawFiles.filter(file => 
        file.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(file.name)
    );

    if (audioFiles.length === 0) {
        alert('Không tìm thấy file âm thanh (.mp3) nào trong thư mục này!');
        return;
    }

    audioFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    storyFiles = audioFiles;

    const lastPlayedName = localStorage.getItem('last_story_name');
    const foundIndex = storyFiles.findIndex(f => f.name === lastPlayedName);
    
    resumeBanner.style.display = 'none'; // Ẩn banner nhắc nhở khi đã nạp file
    renderPlaylist();
    playStory(foundIndex !== -1 ? foundIndex : 0);
}

folderUpload.addEventListener('change', handleFilesSelected);
audioUpload.addEventListener('change', handleFilesSelected);

function renderPlaylist() {
    playlistEl.innerHTML = '';
    storyFiles.forEach((file, index) => {
        const li = document.createElement('li');
        
        // Kiểm tra trạng thái của từng chương
        const isDone = localStorage.getItem('done_' + file.name) === 'true';
        const savedSec = parseFloat(localStorage.getItem('progress_' + file.name)) || 0;
        
        let statusTag = '';
        if (isDone) {
            statusTag = ' <span style="color: #03dac6; font-size: 0.85em;">✔ Đã xong</span>';
        } else if (savedSec > 5) {
            statusTag = ` <span style="color: #ffb74d; font-size: 0.85em;">⏸ ${formatTime(savedSec)}</span>`;
        }

        li.innerHTML = `${index + 1}. ${file.name}${statusTag}`;
        if (index === currentIndex) li.classList.add('active');
        
        li.addEventListener('click', () => playStory(index));
        playlistEl.appendChild(li);
    });

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
        const finishedName = storyFiles[currentIndex].name;
        localStorage.removeItem('progress_' + finishedName);
        localStorage.setItem('done_' + finishedName, 'true'); // Đánh dấu đã nghe xong
    }
    if (currentIndex + 1 < storyFiles.length) {
        playStory(currentIndex + 1);
    } else {
        renderPlaylist();
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