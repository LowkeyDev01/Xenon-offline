const fetchUrl = 'http://localhost:8080'
const sessionId = localStorage.getItem('sessionId');
const logoutBtn = document.getElementById('logout'); // Add this line


function displayMovie() {
    document.querySelectorAll('.mee').forEach(movie => {
        movie.addEventListener('click', () => {

            if (!sessionId) {
                alert('Log in!')
                return;
            }
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
        const fetches = await fetch(`${fetchUrl}/autologin`, {
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
        const fetches = await fetch(`${fetchUrl}/login`, {
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
        const fetches = await fetch(`${fetchUrl}/logout`, {
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

//Register Function
async function signUp(username, password, signup_code) {
    if (!username || !password || !signup_code) {
        console.error('missing field')
        return;
    }
    try {
        const fetches = await fetch(`${fetchUrl}/register`, {
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
        const fetches = await fetch(`${fetchUrl}/upload`, {
            method: 'POST',
            body: formdata
        })
        const response = await fetches.json();
        if (!fetches.ok) {
            alert(response.error)
            return;
        }
        if (response.success === true) {
            console.log('file Uploaded!')
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
        container.dataset.src = re.file_path;

        const img = document.createElement('img');
        img.src = re.cover_img;
        img.className = 'h-50 w-full object-fill rounded-lg';

        const titleBox = document.createElement('div');
        titleBox.className = 'w-full flex justify-center items-center h-12 rounded-b-lg';
        titleBox.textContent = re.movie_name;

        //Calculating time
        const now = new Date();
        const expiryDate = new Date(re.expiry_date);;
        const expireMs = expiryDate - now;
        const expireDays = Math.floor(expireMs / (1000 * 60 * 60 * 24));

        const timer = document.createElement('div');
        timer.className = 'absolute top-0 font-bold right-0 w-8 h-8 flex justify-center items-center bg-gray-100 rounded-tr-lg text-red-600'
        timer.textContent = expireDays;

        //appending
        container.appendChild(img);
        container.appendChild(titleBox);
        container.appendChild(timer);
        document.querySelector('.hja').appendChild(container)
    }
    displayMovie();
}
//Fetching all the movies
async function fetchMovies() {
    try {
        const fetches = await fetch(`${fetchUrl}/movies`);
        const res = await fetches.json();
        console.log(res)
        if(!fetches.ok){
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
        const fetches = await fetch(`${fetchUrl}/download`, {
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

        if(!fetches.ok){
            console.log(res.error)
            return;
        }

        console.log(res)
        renderMovies(res)
    }
    catch (err) {
        console.error(err)
    }
}

async function search(query) {
    try {
        const fetches = await fetch(`${fetchUrl}/search?q=${encodeURIComponent(query)}`);
        const res = await fetches.json();
        console.log(res)

        renderMovies(res)
    }
    catch (err) {
        console.error(err)
    }
}

async function changePassword(sessionId, oldpass, newpass) {
    if (!sessionId || !oldpass || !newpass) {
        console.log('missing field')
        return;
    }
    try {
        const fetches = await fetch(`${fetchUrl}/changepassword`, {
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
        alert('Signup failed - Please try again');
    }
}