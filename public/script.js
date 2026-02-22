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
            b.classList.remove('text-purple-600')
            b.classList.add('text-black')
        })
        btn.classList.remove('text-black')
        btn.classList.add('text-purple-600')

        document.getElementById('video').pause()
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
        const video = document.getElementById('video');
        video.pause();
        video.currentTime = 0

        // 3. Reset the Play Icon
        const icon = document.getElementById('playBtn');
        if (icon) {
            icon.setAttribute('data-lucide', 'play');
            lucide.createIcons();
        }

        // 4. Reset the Progress Bar to empty
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        const currentBlobUrl = video.src;
        if (currentBlobUrl.startsWith('blob:')) {
            URL.revokeObjectURL(currentBlobUrl);
            console.log('RAM cleared!')
        }
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
    const video = document.createElement('video')

    const url = URL.createObjectURL(movieFile.files[0]);

    video.src = url
    video.className = 'object-cover w-full h-full'
    video.controls = true;
    clickVideo.appendChild(video)
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
    uploadbox.classList.remove('scale-100')
    uploadbox.classList.remove('opacity-100')
    uploadbox.classList.add('scale-0')
    uploadbox.classList.add('opacity-0')

    //Putting the formal UI
    clickImg.textContent = ''
    clickImg.innerHTML = '<p class="text-xs">Tap to Upload Image</p>'
    movieTitle.value = ''
    clickVideo.textContent = ''
    clickVideo.innerHTML = '<p class="text-xs">Tap to Upload Video</p>'
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
            // 1. Close the UI
            movieBox.classList.remove('scale-100');
            movieBox.classList.add('scale-0');

            // 2. Stop the video
            const video = document.getElementById('video');
            video.pause();
            video.currentTime = 0

            // 3. Reset the Play Icon
            const icon = document.getElementById('playBtn');
            if (icon) {
                icon.setAttribute('data-lucide', 'play');
                lucide.createIcons();
            }

            // 4. Reset the Progress Bar to empty
            const progressBar = document.getElementById('progress-bar');
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        }
    }
});


document.getElementById('sheath').addEventListener('dblclick', () => {
    if (document.getElementById('video').paused) {
        document.getElementById('video').play();
        const icon = document.getElementById('playBtn');
        icon.setAttribute('data-lucide', 'pause');
        lucide.createIcons();
    } else {
        document.getElementById('video').pause();
        const icon = document.getElementById('playBtn');
        icon.setAttribute('data-lucide', 'play');
        lucide.createIcons();
    }
})
fetchMovies();