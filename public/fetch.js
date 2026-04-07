const fetchUrl = 'http://10.117.166.172:8080'
const sessionId = localStorage.getItem('sessionId');
const logoutBtn = document.getElementById('logout');
// displayMovie()

async function displayMovie() {
    document.querySelectorAll('.mee').forEach(movie => {
        movie.addEventListener('click', async () => {
            const movieTitle = movie.dataset.title;
            const movieSrc = movie.dataset.file_path;
            try {
                // UI Updates
                document.getElementById('title').textContent = movieTitle;
                movieBox.classList.remove('scale-0', 'opacity-0')
                movieBox.classList.add('scale-100', 'opacity-100')
                document.getElementById('my-video').src = movieSrc
                document.getElementById('down').href = movieSrc


                if (globalExpireDays === null || globalExpireDays < 0) {
                    document.getElementById('down').classList.add('hidden')
                    return;
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
}
function displayStats(downloads) {
    document.getElementById('downloads').textContent = downloads;
    document.getElementById('earnings').innerHTML = `&#x20A6;${downloads * 10}`
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
        document.getElementById('pfp').classList.remove('rounded-full');
        document.getElementById('pfp').classList.add('rounded-xl');
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
        // Calculate expiry days
        const now = new Date();
        const expiryDate = new Date(re.expiry_date);
        const expireMs = expiryDate - now;
        const expireDays = Math.floor(expireMs / (1000 * 60 * 60 * 24));

        // Create main container
        const container = document.createElement('div')
        container.className = 'group relative overflow-hidden mee cursor-pointer transition-all duration-300 hover:shadow-2xl'
        container.dataset.title = re.movie_name;
        container.dataset.Id = re.file_id;
        container.dataset.file_path = re.file_path;

        // Image container with overlay
        const imageWrapper = document.createElement('div')
        imageWrapper.className = 'relative w-full h-56 md:h-64 overflow-hidden bg-gray-900'

        const img = document.createElement('img');
        img.src = re.cover_img;
        img.className = 'w-full h-full object-cover group-hover:scale-110 transition-transform duration-300';
        img.alt = re.movie_name;

        // Dark overlay
        const overlay = document.createElement('div')
        overlay.className = 'absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300'

        // Content container
        const content = document.createElement('div')
        content.className = 'absolute inset-0 flex flex-col justify-between p-3 md:p-4'

        // Top section - expiry badge
        const topSection = document.createElement('div')
        topSection.className = 'flex justify-end'

        const expiryBadge = document.createElement('span')
        expiryBadge.className = 'px-2 py-1 bg-red-600/90 text-white text-xs font-semibold rounded-full backdrop-blur-sm'
        expiryBadge.textContent = `${expireDays}d left`

        // Bottom section - title
        const bottomSection = document.createElement('div')
        bottomSection.className = 'space-y-2'

        const movieTitle = document.createElement('h3')
        movieTitle.className = 'text-white font-bold text-sm md:text-base line-clamp-2 group-hover:text-blue-400 transition-colors duration-300'
        movieTitle.textContent = re.movie_name

        // Play button (appears on hover)
        const playButton = document.createElement('div')
        playButton.className = 'absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        
        const playIcon = document.createElement('div')
        playIcon.className = 'w-16 h-16 bg-blue-500/90 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300'
        playIcon.innerHTML = '<i data-lucide="play" class="w-8 h-8 text-white ml-1"></i>'

        // Assemble the card
        topSection.appendChild(expiryBadge)
        bottomSection.appendChild(movieTitle)
        content.appendChild(topSection)
        content.appendChild(bottomSection)
        playButton.appendChild(playIcon)

        imageWrapper.appendChild(img)
        imageWrapper.appendChild(overlay)
        imageWrapper.appendChild(content)
        imageWrapper.appendChild(playButton)

        container.appendChild(imageWrapper)
        document.querySelector('.hja').appendChild(container)
    }
    
    // Reinitialize Lucide icons for new elements
    lucide.createIcons();
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
