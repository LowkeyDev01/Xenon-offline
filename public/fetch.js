const fetchUrl = 'http://localhost:8080'
const sessionId = localStorage.getItem('sessionId');
const logoutBtn = document.getElementById('logout'); // Add this line
displayMovie()

async function displayMovie() {
    document.querySelectorAll('.mee').forEach(movie => {
        movie.addEventListener('click', async () => {
            const movieTitle = movie.dataset.title;
            const movieSrc = movie.dataset.file_path; // This is "uploads/filename.mp4"
            try {

                // UI Updates
                document.getElementById('title').textContent = movieTitle;
                const videoElement = document.getElementById('video');
                movieBox.classList.remove('scale-0', 'opacity-0')
                movieBox.classList.add('scale-100', 'opacity-100')
                document.getElementById('video').src = movieSrc
                document.getElementById('down').href = movieSrc

                // Expiry logic
                if (globalExpireDays === null) {
                    document.getElementById('down').classList.add('hidden');
                    return;
                }
                else {
                    document.getElementById('sheath').classList.remove('flex');
                    videoElement.controls = true;
                    document.getElementById('sheath').classList.add('hidden');
                }
            }
            catch (err) {
                alert(err)
                console.log({ 'Error': err })
                return;
            }
        });
    });
}

function displayProfile(username, account_type) {
    logScreen.classList.remove('top-0');
    logScreen.classList.add('-top-500');

    user.textContent = username;
    roles.textContent = account_type.toLowerCase();
}
function displayStats(downloads) {
    document.getElementById('downloads').textContent = downloads;
    document.getElementById('earnings').innerHTML = `&#x20A6;${downloads * 25}`
}
function displayExpiryDate(expiry_date) {
    if (!expiry_date) {
        return;
    }

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

//Autologin
async function autologin() {
    if (!sessionId) {
        console.log('Invalid Credentials')
        alert('Invalid Session - Please login again')
        return;
    }

    try {
        const fetches = await fetch(`${fetchUrl}/auth/autologin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        })

        const response = await fetches.json();

        if (!fetches.ok) {
            alert(response.error)
            return false;
        }
        console.log('Login successful:', response)

        //check expiry time
        const now = new Date();
        const expiryDate = new Date(response.expiry_date);;
        const expireMs = expiryDate - now;
        const expireDays = Math.floor(expireMs / (1000 * 60 * 60 * 24));
        globalExpireDays = expireDays;

        displayProfile(response.username, response.role);
        displayExpiryDate(expireDays)
        checkrole(response.role)
        displayStats(response.creatorNum)
    }
    catch (err) {
        console.error('Autologin failed:', err)
        alert('Connection error - Please try again')
    }
}

//Login
async function login(userName, password) {
    if (!userName || !password) {
        console.log('Field empty')
        return;
    }
    try {
        const fetches = await fetch(`${fetchUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName, password })
        })

        const response = await fetches.json();
        if (response.error === 'Account Expired') {
            const renewPopup = document.getElementById('renewSubPopup');
            renewPopup.classList.remove('scale-0', 'opacity-0');
            renewPopup.classList.add('scale-100', 'opacity-100');
            return;
        }

        if (!fetches.ok) {
            alert(response.error)
            return;
        }
        console.log('Login successful:', response)
        localStorage.setItem('sessionId', response.sessionId)
        location.reload();
    }
    catch (err) {
        console.error('login failed:', err)
        alert('Connection Failed!')
    }
}

//Signout
async function Logout(sessionId) {
    if (!sessionId) {
        console.log('Invalid Credentials')
        alert('Invalid Session - Please login again')
        return;
    }

    try {
        const fetches = await fetch(`${fetchUrl}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        })

        if (!fetches.ok) {
            alert('Session expired or invalid - Please login again')
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
//Delete Account
async function deleteAccount(sessionId) {
    if (!sessionId) {
        console.log('Invalid Credentials')
        alert('Invalid Session - Please login again')
        return;
    }

    try {
        const fetches = await fetch(`${fetchUrl}/auth/deleteAccount`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        })

        if (!fetches.ok) {
            alert('Session expired or invalid - Please login again')
            return;
        }

        const response = await fetches.json();
        console.log('Delete Account successful:', response)
        localStorage.clear();
        location.reload(); // Reload page after logout
    }
    catch (err) {
        console.error('Account deletion failed:', err)
        alert('Connection error - Please try again')
    }
}

//Register Function
async function signUp(username, password, signup_code) {
    if (!username || !password || !signup_code) {
        console.error('missing field')
        return;
    }
    try {
        const fetches = await fetch(`${fetchUrl}/auth/register`, {
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
//Upload Function
async function uploadFile(formdata) {

    try {
        const fetches = await fetch(`${fetchUrl}/movies/upload`, {
            method: 'POST',
            body: formdata
        })
        const response = await fetches.json();
        if (!fetches.ok) {
            alert(response.error)
            document.getElementById('message').textContent = ''
            return;
        }
        if (response.success === true) {
            document.getElementById('message').textContent = ''
            document.getElementById('message').textContent = 'File uploaded!'
            location.reload();
        }
    } catch (err) {
        console.error('Upload failed:', err);
        alert('Upload failed!');
    }
}

async function renderMovies(res) {
    document.querySelector('.hja').textContent = ''

    for (let re of res) {
        const container = document.createElement('div')
        container.className = 'w-full relative md:max-w-90 lg:max-w-100 mee'
        container.dataset.title = re.movie_name;
        container.dataset.Id = re.file_id;
        container.dataset.file_path = re.file_path;

        const img = document.createElement('img');
        img.src = re.cover_img;
        img.className = 'h-50 w-full object-fill rounded-lg';

        

        //Calculating time
        const now = new Date();
        const expiryDate = new Date(re.expiry_date);
        const expireMs = expiryDate - now;
        const expireDays = Math.floor(expireMs / (1000 * 60 * 60 * 24));

        const timer = document.createElement('div');
        timer.className = 'absolute py-2 px-2 w-full grid grid-cols-2 justify-center items-end h-full bg-linear-to-b from-transparent to-black top-0 pointer-events-auto z-10'

        const movie_name = document.createElement('p');
        movie_name.className = 'flex flex-wrap';
        movie_name.textContent = re.movie_name;

        const movie_time = document.createElement('p');
        movie_time.className = 'text-end text-red-600';
        movie_time.textContent = `${expireDays} days left`;
        

        //appending
        container.appendChild(img);
        timer.appendChild(movie_name)
        timer.appendChild(movie_time)
        container.appendChild(timer);
        document.querySelector('.hja').appendChild(container)
    }
    displayMovie();
}
//Fetching all the movies
async function fetchMovies() {
    try {
        const fetches = await fetch(`${fetchUrl}/movies/all`);
        const res = await fetches.json();
        console.log(res)
        if (!fetches.ok) {
            console.log(res.error)
            document.querySelector('.hja').innerHTML = `<p class="pt-5">${res.error}</p>`;
            return;
        }
        renderMovies(res)
    }
    catch (err) {
        console.error(err)
    }
}

//Download Function
async function download(file_path, sessionId) {
    try {
        const fetches = await fetch(`${fetchUrl}/movies/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_path, sessionId })
        })
        const response = await fetches.json();
        if (!fetches.ok) {
            alert(response.error)
            return;
        }

        console.log(response)
    } catch (err) {
        console.error('Download Error', err);
    }
}
//TRYALL

async function fetchMovieTags(tag) {
    try {
        const fetches = await fetch(`${fetchUrl}/movies/${tag}`);
        const res = await fetches.json();

        if (!fetches.ok) {
            console.log(res.error)
            document.querySelector('.hja').innerHTML = `<p class="pt-5">${res.error}</p>`;
            return;
        }

        console.log(res)
        renderMovies(res)
    }
    catch (err) {
        console.error(err)
    }
}
let timerId;

async function search(query) {
    if (!query) return;

    clearTimeout(timerId);

    timerId = setTimeout(async () => {
        try {
            const fetches = await fetch(`${fetchUrl}/movies/search?q=${encodeURIComponent(query)}`);
            const res = await fetches.json();

            console.log(res)
            renderMovies(res)
        }
        catch (err) {
            console.error(err)
        }
    }, 400)
}

async function changePassword(sessionId, oldpass, newpass) {
    if (!sessionId || !oldpass || !newpass) {
        console.log('missing field')
        return;
    }
    try {
        const fetches = await fetch(`${fetchUrl}/auth/changepassword`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, oldpass, newpass })
        })
        const response = await fetches.json();
        if (!fetches.ok) {
            alert(response.error)
            return;
        }
        if (response.success === true) {
            alert('Password Changed successfully!');
            changePasswordScreen.classList.remove('scale-100', 'opacity-100')
            changePasswordScreen.classList.add('scale-0', 'opacity-0')
            clearr()
        }
    } catch (err) {
        console.error('Signup failed:', err);
        alert('Server Error - try again later!');
    }
}

async function renewSub(newCode) {
    if (!sessionId || !newCode) {
        document.getElementById('err').textContent = 'Missing field';
        return;
    }
    try {
        const fetches = await fetch(`${fetchUrl}/auth/renewSub`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, newCode })
        })
        const response = await fetches.json();
        if (!fetches.ok) {
            document.getElementById('err').textContent = response.error;
            return;
        }
        if (response.success === true) {
            alert('Subscription Renewed!');
            location.reload();
        }
    } catch (err) {
        console.error('Server error:', err);
        alert('Server Error - try again later!');
    }
}
let lastScroll = 0
window.addEventListener('scroll', () => {
    let currentScroll = window.scrollY
    if (currentScroll > lastScroll) {
        document.getElementById('nav').classList.remove('bottom-4')
        document.getElementById('nav').classList.add('-bottom-20')
    }
    else {
        document.getElementById('nav').classList.remove('-bottom-20')
        document.getElementById('nav').classList.add('bottom-4')
    }

    lastScroll = currentScroll
})

//Video Controls
//Adding something here
const video = document.getElementById('video');
// Select the specific parent of the play button
const playBtn = document.getElementById('playBtn');
const playBtnContainer = playBtn.parentElement;

playBtnContainer.addEventListener('click', function () {
    // Look for the icon ONLY within this specific clicked container
    // We use the ID to ensure we aren't grabbing the Rewind icon
    const icon = document.getElementById('playBtn');

    if (video.paused || video.ended) {
        video.play();
        icon.setAttribute('data-lucide', 'pause');
    } else {
        video.pause();
        icon.setAttribute('data-lucide', 'play');
    }

    // Re-render Lucide icons
    lucide.createIcons();
});

// To fix the "Video Finish" issue, add this:
video.addEventListener('ended', () => {
    const icon = document.getElementById('playBtn');
    icon.setAttribute('data-lucide', 'play');
    lucide.createIcons();
});

document.getElementById('rewind').addEventListener('click', () => {
    video.currentTime -= 10
})

document.getElementById('skipForward').addEventListener('click', () => {
    video.currentTime += 10
})

// Fullscreen Function
document.getElementById('maximize').addEventListener('click', () => {
    const movieBox = document.getElementById('movie-box');

    // Toggle the "Fake Fullscreen" class
    movieBox.classList.toggle('theater-mode');

    // Optional: Change the icon to "minimize"
    const icon = document.querySelector('#maximize [data-lucide]');
    if (movieBox.classList.contains('theater-mode')) {
        icon.setAttribute('data-lucide', 'minimize-2');
    } else {
        icon.setAttribute('data-lucide', 'maximize-2');
    }
    lucide.createIcons();
});

// 1. Grab the bar
const progressBar = document.getElementById('progress-bar');

// 2. Update the width based on video playback
video.addEventListener('timeupdate', () => {
    if (video.duration) {
        // Calculate percentage
        const percentage = (video.currentTime / video.duration) * 100;

        // Apply directly to style
        progressBar.style.width = `${percentage}%`;
    }
});

// 3. Reset when it ends (Optional but cleaner)
video.addEventListener('ended', () => {
    progressBar.style.width = '0%';
});

