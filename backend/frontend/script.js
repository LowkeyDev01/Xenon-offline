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
const movies = document.querySelectorAll('.mee');

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
function displayMovie() {
    movies.forEach(movie => {
        movie.addEventListener('click', () => {
            //Replacing title
            const movieTitle = movie.dataset.title;
            const movieSrc = movie.dataset.src;
            console.log(movieSrc)
            document.getElementById('title').textContent = movieTitle;
            document.getElementById('video').src = movieSrc;
            document.getElementById('down').href = movieSrc;
            console.log(document.getElementById('down').href)
            //Animation side
            movieBox.classList.remove('scale-0')
            movieBox.classList.remove('scale-0')
            movieBox.classList.remove('opacity-0')
            movieBox.classList.add('scale-100')
            movieBox.classList.add('scale-100')
        })
    })

}
displayMovie()
const close = document.getElementById('move');
close.addEventListener('click', () => {
    if (movieBox.classList.contains('scale-100')) {
        movieBox.classList.remove('scale-100')
        movieBox.classList.add('scale-0')
        document.getElementById('video').muted = true
    }
})

function displayProfile(username, account_type) {
    logScreen.classList.remove('top-0');
    logScreen.classList.add('-top-500');

    user.textContent = username;
    roles.textContent = account_type.toLowerCase();

}
function displayExpiryDate(expiry_date) {
    expireInfo.textContent = `Warning! Account Expires in ${expiry_date}d`
}
function checkrole(role) {
    if (role === 'CREATOR') {
        document.querySelector('.stats').classList.remove('hidden');
        document.querySelector('.stats').classList.add('grid');
        document.querySelector('.statname').classList.remove('hidden');
        uploadtrigger.classList.remove('hidden')
        uploadtrigger.classList.add('flex')
    }
}
uploadtrigger.addEventListener('click', () => {
    if (uploadbox.classList.contains('scale-0')) {
        uploadbox.classList.remove('scale-0');
        uploadbox.classList.remove('opacity-0');
        uploadbox.classList.add('scale-100')
        uploadbox.classList.add('opacity-100')
    }
})

async function autologin() {
    if (!sessionId) {
        console.log('Invalid Credentials')
        alert('Invalid Session - Please login again')
        return;
    }

    try {
        const fetches = await fetch(`${URL}/autologin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        })

        const response = await fetches.json();

        if (!fetches.ok) {
            alert('Session expired or invalid - Please login again')
            localStorage.removeItem('sessionId');
            return;
        }
        console.log('Login successful:', response)

        //check expiry time
        const now = new Date();
        const expiryDate = new Date(response.expiry_date);;
        const expireMs = expiryDate - now;
        const expireDays = Math.floor(expireMs / (1000 * 60 * 60 * 24));

        displayMovie();
        displayProfile(response.username, response.role);
        displayExpiryDate(expireDays)
        checkrole(response.role)
    }
    catch (err) {
        console.error('Autologin failed:', err)
        alert('Connection error - Please try again')
    }
}

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


async function login(userName, password) {
    if (!userName || !password) {
        console.log('Field empty')
        return;
    }
    try {
        const fetches = await fetch(`${URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName, password })
        })

        const response = await fetches.json();

        if (!fetches.ok) {
            alert(response.error)
            return;
        }
        console.log('Login successful:', response)
        localStorage.setItem('sessionId', response.sessionId)
        location.reload();
    }
    catch (err) {
        console.error('Autologin failed:', err)
        alert(err)
    }
}

async function Logout(sessionId) {
    if (!sessionId) {
        console.log('Invalid Credentials')
        alert('Invalid Session - Please login again')
        return;
    }

    try {
        const fetches = await fetch(`${URL}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        })

        if (!fetches.ok) {
            alert('Session expired or invalid - Please login again')
            localStorage.removeItem('sessionId');
            return;
        }

        const response = await fetches.json();
        console.log('Logout successful:', response)
        localStorage.clear();
        location.reload(); // Reload page after logout
    }
    catch (err) {
        console.error('Logout failed:', err)
        alert('Connection error - Please try again')
    }
}

async function signUp(username, password, signup_code) {
    if (!username || !password || !signup_code) {
        console.error('missing field')
        return;
    }
    try {
        const fetches = await fetch(`${URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, signup_code })
        })
        const response = await fetches.json();
        if (!fetches.ok) {
            alert(response.error)
            return;
        }
        if (response.success === true) {
            localStorage.setItem('sessionId', response.sessionId);
            location.reload();
        }
    } catch (err) {
        console.error('Signup failed:', err);
        alert('Signup failed - Please try again');
    }
}

closeBtn.addEventListener('click', () => {
    uploadbox.classList.remove('scale-100')
    uploadbox.classList.remove('opacity-100')
    uploadbox.classList.add('scale-0')
    uploadbox.classList.add('opacity-0')
})

//Upload Function

const uploadForm = document.getElementById('Uploadform');
const coverFile = document.getElementById('coverFile');
const clickImg = document.getElementById('clickimage')

clickImg.addEventListener('click', () => {
    coverFile.click();
})

coverFile.addEventListener('change', () => {
    if (coverFile.files && coverFile.files[0]) {
        clickImg.textContent = ''
        const img = document.createElement('img')

        const url = URL.createObjectURL(coverFile.files[0]);
        
        img.src = url
        img.className = 'object-cover w-full h-full'
        clickImg.appendChild(img)
    }
})
