const image = document.getElementById('image');
const images = ['./images/two.jpg', './images/three.jpg', './images/one.jpg', './images/four.jpg']
let index = 0
const leftBtn = document.getElementById('left');
const rightBtn = document.getElementById('right');
const tabs = document.querySelectorAll('.tab');
const logScreen = document.getElementById('login-screen');
const user = document.getElementById('user')
const roles = document.getElementById('role')
const expireInfo = document.getElementById('expire-warning')
const loginForm = document.getElementById('login');
const uploadtrigger = document.getElementById('uploadplus')
const uploadbox = document.getElementById('uploadbox')
const closeBtn = document.getElementById('cancel');
let globalExpireDays = null;




rightBtn.addEventListener('click', () => {
    index++;
    if (index >= images.length) {
        index = 0;
    }
    image.src = images[index]
})
leftBtn.addEventListener('click', () => {
    index--;
    if (index < 0) {
        index = images.length - 1;
    }
    image.src = images[index]
})


tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => {
            t.classList.remove('bg-black', 'text-white', 'dark:bg-white', 'dark:text-black')
            t.classList.add('text-black', 'bg-white', 'dark:bg-black', 'dark:text-white')
        });
        tab.classList.remove('bg-white', 'text-black', 'dark:bg-black', 'dark:text-white')
        tab.classList.add('bg-black', 'text-white', 'dark:bg-white', 'dark:text-black');

        const tag = tab.textContent.trim()
        fetchMovieTags(tag)
    });
});

const btns = document.querySelectorAll('.btn');
const pages = document.querySelectorAll('.panel')

btns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        btns.forEach(b => {
            b.classList.remove('dark:text-white', 'text-black')
            b.classList.add('dark:text-white/60', 'text-black/60')
        })
        btn.classList.remove('dark:text-white/60', 'text-black/60')
        btn.classList.add('dark:text-white', 'text-black')

        document.getElementById('my-video').pause()
        pages.forEach(page => {
            page.classList.remove('flex', 'appear')
            page.classList.add('hidden')
        })
        const targetPage = document.getElementById(targetId);
        targetPage.classList.remove('hidden')
        targetPage.classList.add('flex')

    })
})

const movieSearch = document.getElementById('searchmovies');
const searchBar = document.getElementById('search');
searchBar.classList.remove('appear');
const movieBox = document.getElementById('movie-box');


movieSearch.addEventListener('click', () => {
    if (searchBar.classList.contains('-top-16')) {
        searchBar.classList.remove('-top-16')
        searchBar.classList.add('top-12')
    }
    else {
        searchBar.classList.remove('top-12')
        searchBar.classList.add('-top-16')
    }
})

searchBar.addEventListener('input', (e) => {
    const value = e.currentTarget.value.trim();

    clearTimeout(timerId)

    if (value.length > 0) {
        search(value)
    }
    else {
        fetchMovies()
    }
})

const close = document.getElementById('move');
close.addEventListener('click', () => {
    if (movieBox.classList.contains('scale-100')) {
        // 1. Close the UI
        movieBox.classList.remove('scale-100');
        movieBox.classList.add('scale-0');

        // 2. Stop the video

        video.pause();
        video.currentTime = 0
    }
})

uploadtrigger.addEventListener('click', () => {
    if (uploadbox.classList.contains('scale-0')) {
        uploadbox.classList.remove('scale-0');
        uploadbox.classList.remove('opacity-0');
        uploadbox.classList.add('scale-100')
        uploadbox.classList.add('opacity-100')
    }
})

const signupForm = document.getElementById('sign-up')
const forceCreate = document.getElementById('show-sign')
const forcesign = document.getElementById('show-log')

forceCreate.addEventListener('click', () => {
    loginForm.classList.remove('flex');
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    signupForm.classList.add('flex');
})

forcesign.addEventListener('click', () => {
    signupForm.classList.remove('flex');
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    loginForm.classList.add('flex');
})



//Upload Function

const uploadForm = document.getElementById('Uploadform');
const coverFile = document.getElementById('coverFile');
const movieFile = document.getElementById('file');
const clickImg = document.getElementById('clickimage')
const clickVideo = document.getElementById('clickVid')
const movieTitle = document.getElementById('movieTitle');
const category = document.getElementById('category')

clickImg.addEventListener('click', () => {
    coverFile.click();
})

coverFile.addEventListener('change', () => {
    clickImg.textContent = ''
    const img = document.createElement('img')

    const url = URL.createObjectURL(coverFile.files[0]);

    img.src = url
    img.className = 'object-cover w-full h-full'
    clickImg.appendChild(img)
})

clickVideo.addEventListener('click', () => {
    movieFile.click();
})

movieFile.addEventListener('change', () => {
    clickVideo.textContent = ''

    const url = URL.createObjectURL(movieFile.files[0]);

    // FIX: Use a separate video element for preview, not the global 'video'
    const previewVideo = document.createElement('video')
    previewVideo.src = url
    previewVideo.className = 'object-cover w-full h-full'
    previewVideo.controls = true;
    clickVideo.appendChild(previewVideo)
})

uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!coverFile.files[0] || !movieFile.files[0] || !movieTitle || !category) {
        document.getElementById('message').textContent = 'Incomplete fields'
        return;
    }
    console.log(coverFile.files[0], movieFile.files[0], movieTitle.value, category.value)
    if (document.getElementById('movieTitle').value === '') {
        document.getElementById('message').textContent = 'Movie title missing'
        return;
    }
    const formData = new FormData();
    formData.append('file', movieFile.files[0]);
    formData.append('cover', coverFile.files[0]);
    formData.append('title', movieTitle.value);
    formData.append('category', category.value);
    formData.append('sessionId', sessionId);

    document.getElementById('message').textContent = ''
    document.getElementById('message').textContent = 'Uploading please wait..'
    uploadFile(formData)
})

closeBtn.addEventListener('click', () => {
    console.log('hit1')
    uploadbox.classList.remove('scale-100')
    uploadbox.classList.remove('opacity-100')
    uploadbox.classList.add('scale-0')
    uploadbox.classList.add('opacity-0')

    //Putting the formal UI back
    clickImg.textContent = ''
    clickImg.innerHTML = '<i data-lucide="camera" class="w-8 h-8 "></i><p class="text-xs">Tap to Upload Image</p>'
    movieTitle.value = ''
    
    // FIX: Clear the video properly
    clickVideo.textContent = ''
    clickVideo.innerHTML = '<i data-lucide="video" class="w-8 h-8"></i><p class="text-xs">Tap to Upload Video</p>'
    movieFile.value = '' // Reset the file input
    coverFile.value = '' // Reset the cover input
})

autologin();

loginForm.addEventListener('submit', (e) => {
    const username = document.getElementById('username').value
    const pass = document.getElementById('password').value
    e.preventDefault();
    login(username, pass)
})

const popUp = document.getElementById('logoutPopup');
const closePOP = document.getElementById('closeLogout');

document.getElementById('logoutPops').addEventListener('click', () => {
    popUp.classList.remove('scale-0', 'opacity-0')
    popUp.classList.add('scale-100', 'opacity-100')
})
closePOP.addEventListener('click', () => {
    popUp.classList.remove('scale-100', 'opacity-100')
    popUp.classList.add('scale-0', 'opacity-0')
})

logoutBtn.addEventListener('click', () => {
    Logout(sessionId);
    console.log('logged out')
})


//Delete account
const deletePopUp = document.getElementById('deletePopup');
const closePop = document.getElementById('closeDelete');

document.getElementById('delete').addEventListener('click', () => {
    deletePopUp.classList.remove('scale-0', 'opacity-0')
    deletePopUp.classList.add('scale-100', 'opacity-100')
})
closePop.addEventListener('click', () => {
    deletePopUp.classList.remove('scale-100', 'opacity-100')
    deletePopUp.classList.add('scale-0', 'opacity-0')
})
const deleteBtn = document.getElementById('deleteAcc');
deleteBtn.addEventListener('click', () => {
    deleteAccount(sessionId);
    console.log('Account Deleted!')
})


signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const signuser = document.getElementById('userss').value;
    const signpass = document.getElementById('pass').value;
    const signcode = document.getElementById('SignupCode').value;
    console.log(signuser, signpass, signcode)
    signUp(signuser, signpass, signcode);
})

document.getElementById('down').addEventListener('click', async (e) => {
    e.preventDefault();

    const targetLink = e.currentTarget;
    const fullUrlString = targetLink.href;
    const fullUrl = new URL(fullUrlString);
    const movieName = document.getElementById('title').textContent || 'movie';
    const movieId = fullUrl.pathname.split('/').pop();

    try {
        // 1. Log to your backend
        await download(movieId, sessionId);

        // 2. FORCE DOWNLOAD (The "Ghost Link" Trick)
        const ghostLink = document.createElement('a');
        ghostLink.href = fullUrlString;

        // This attribute is the magic that forces a download instead of playing
        ghostLink.download = `${movieName}.mp4`;

        document.body.appendChild(ghostLink);
        ghostLink.click();
        document.body.removeChild(ghostLink);

    } catch (err) {
        console.error("Logging failed", err);
        // Fallback: just try to open it if logging crashes
        window.location.href = fullUrlString;
    }
})

const changePassForm = document.getElementById('ChangePassword');
const changePasswordScreen = document.getElementById('screen')
const closeChange = document.getElementById('ffar')
//Making the pop Show
document.getElementById('meuver').addEventListener('click', () => {
    changePasswordScreen.classList.remove('scale-0', 'opacity-0')
    changePasswordScreen.classList.add('scale-100', 'opacity-100')
})
closeChange.addEventListener('click', () => {
    changePasswordScreen.classList.remove('scale-100', 'opacity-100')
    changePasswordScreen.classList.add('scale-0', 'opacity-0')
    clearr()
})
changePassForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const oldpass = document.getElementById('oldpass').value;

    const newpass0 = document.getElementById('newpass0').value
    const newpass1 = document.getElementById('newpass1').value

    if (newpass0 !== newpass1) {
        alert('Baba the passwords no match');
        return;
    }

    changePassword(sessionId, oldpass, newpass1)
})
function clearr() {
    document.getElementById('oldpass').value = ''

    document.getElementById('newpass0').value = ''
    document.getElementById('newpass1').value = ''

}

const renewSubForm = document.getElementById('renewSubForm');
renewSubForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newCode = document.getElementById('newCode').value;
    renewSub(newCode)
})
const closeRenew = document.getElementById('closeRenewPop');
closeRenew.addEventListener('click', () => {
    const renewPopup = document.getElementById('renewSubPopup');
    renewPopup.classList.remove('scale-100', 'opacity-100');
    renewPopup.classList.add('scale-0', 'opacity-0');
    document.getElementById('newCode').value = '';
    document.getElementById('err').textContent = '';
})

//THe one on profile page
const renewBtn = document.getElementById('renewADD');
renewBtn.addEventListener('click', () => {
    const renewPopup = document.getElementById('renewSubPopup');
    renewPopup.classList.remove('scale-0', 'opacity-0');
    renewPopup.classList.add('scale-100', 'opacity-100');
})



window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const movieBox = document.getElementById('movie-box');

        if (movieBox.classList.contains('scale-100')) {
            movieBox.classList.remove('scale-100');
            movieBox.classList.add('scale-0');

            // FIX: Use correct video ID
            document.getElementById('my-video').pause();
            document.getElementById('my-video').currentTime = 0;

            const progressBar = document.getElementById('progress-bar');
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        }
    }
});
fetchMovies();



const video = document.getElementById("my-video");
const container = document.getElementById("video-container");
const shield = document.getElementById("video-shield");
const playBtn = document.getElementById("play-pause");
const playIcon = document.getElementById("play-icon");
const pauseIcon = document.getElementById("pause-icon");
const muteBtn = document.getElementById("mute");
const fullScreenBtn = document.getElementById("full-screen");
const seekBar = document.getElementById("seek-bar");
const curTimeText = document.getElementById("current-time");
const durationText = document.getElementById("duration");

function formatTime(seconds) {
    let min = Math.floor(seconds / 60);
    let sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

function togglePlay() {
    if (video.paused) {
        video.play();
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    } else {
        video.pause();
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    }
}

// Click events now go on the SHIELD to protect the video
shield.addEventListener("click", togglePlay);
playBtn.addEventListener("click", togglePlay);

muteBtn.addEventListener("click", () => {
    video.muted = !video.muted;
    muteBtn.classList.toggle('text-red-500', video.muted);
});

video.addEventListener("loadedmetadata", () => {
    durationText.textContent = formatTime(video.duration);
    seekBar.max = video.duration;
});

video.addEventListener("timeupdate", () => {
    seekBar.value = video.currentTime;
    curTimeText.textContent = formatTime(video.currentTime);
});

seekBar.addEventListener("input", () => {
    video.currentTime = seekBar.value;
});

fullScreenBtn.addEventListener("click", async () => {
    try {
        if (!document.fullscreenElement) {
            // 1. Go Fullscreen
            await container.requestFullscreen();

            // 2. Attempt to lock orientation to landscape
            // Check if the orientation API is supported (mostly Android/Chrome)
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock("landscape").catch(err => {
                    console.log("Orientation lock failed or ignored:", err);
                });
            }
        } else {
            // Exit Fullscreen
            await document.exitFullscreen();

            // Unlock orientation so it returns to normal
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
        }
    } catch (err) {
        console.error("Fullscreen/Orientation Error:", err);
    }
});

// Sync the button icon/text when fullscreen changes (via Esc key or swipe)
document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    }
});

// Block keyboard "S" (some browsers use this as a shortcut to save)
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
    }
    if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
    }
});

let controlsTimeout;
const controls = document.getElementById("video-controls");

function showControls() {
    // Show the controls
    controls.style.opacity = "1";
    container.style.cursor = "default";

    // Clear any existing timer
    clearTimeout(controlsTimeout);

    // Set a new timer to hide them after 3 seconds of stillness
    controlsTimeout = setTimeout(() => {
        // Only hide if the video is actually playing
        if (!video.paused) {
            controls.style.opacity = "0";
            container.style.cursor = "none"; // Also hide the mouse arrow for true cinema feel
        }
    }, 3000);
}

// Trigger this whenever the mouse moves inside the container
container.addEventListener("mousemove", showControls);

// Also show them if the video is paused (so you can see the play button)
video.addEventListener("pause", () => {
    clearTimeout(controlsTimeout);
    controls.style.opacity = "1";
    container.style.cursor = "default";
});