const URL = 'http://localhost:8080'
const sessionId = localStorage.getItem('sessionId');
const logoutBtn = document.getElementById('logout'); // Add this line

autologin();

loginForm.addEventListener('submit', (e) => {
    const username = document.getElementById('username').value
    const pass = document.getElementById('password').value
    e.preventDefault();
    login(username, pass)
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