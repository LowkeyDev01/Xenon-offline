const image = document.getElementById('image');
const images = ['./images/as.png', './images/images.jpeg', './images/jk.jpeg', './images/js.jpeg']
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

    if (value.length > 0) {
        search(value)
    }
    if (value.length === 0) {
        fetchMovies()
    }
})

const close = document.getElementById('move');
close.addEventListener('click', () => {
    if (movieBox.classList.contains('scale-100')) {
        movieBox.classList.remove('scale-100')
        movieBox.classList.add('scale-0')
        document.getElementById('video').muted = true
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
        return;
    }
    console.log(coverFile.files[0], movieFile.files[0], movieTitle.value, category.value)

    const formData = new FormData();
    formData.append('file', movieFile.files[0]);
    formData.append('cover', coverFile.files[0]);
    formData.append('title', movieTitle.value);
    formData.append('category', category.value);
    formData.append('sessionId', sessionId);

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

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const signuser = document.getElementById('userss').value;
    const signpass = document.getElementById('pass').value;
    const signcode = document.getElementById('SignupCode').value;
    console.log(signuser, signpass, signcode)
    signUp(signuser, signpass, signcode);
})

document.getElementById('down').addEventListener('click', (e) => {
    const fullUrl = e.currentTarget.href
    const file_path = new URL(fullUrl).pathname;

    const cleanPath = file_path.startsWith('/') ? file_path.substring(1) : file_path;
    console.log(cleanPath)
    download(cleanPath, sessionId)
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










fetchMovies();