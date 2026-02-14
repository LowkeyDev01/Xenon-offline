import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import crypto from 'crypto';


//Register
export const register = async (req, res) => {
    try {
        const { username, password, signup_code } = req.body;
        const valid_code = await pool.query('SELECT * FROM codes WHERE code_string = $1 AND is_used = false', [signup_code])
        if (!username || !password) {
            return res.status(400).json('Invalid Credentials')
        }
        if (valid_code.rows.length === 0) {
            return res.status(400).json('Invalid Credentials')
        }
        //Hashing the passwords
        const { account_type } = valid_code.rows[0]
        const hashed = await bcrypt.hash(password, 10);

        //Expiry date
        const now = new Date();
        const expiry_date = new Date();
        expiry_date.setDate(now.getDate() + 30);

        //creating automatic session
        const sessionId = crypto.randomBytes(10).toString('hex').toLowerCase();

        await pool.query('INSERT INTO xenon_user (username, password, role, signup_code, expiry_date) VALUES ($1, $2, $3, $4, $5)', [username, hashed, account_type, signup_code, expiry_date]);
        await pool.query('UPDATE codes SET used_at = NOW(), is_used = true WHERE code_string = $1', [signup_code])
        await pool.query('INSERT INTO sessions (session_id, username) VALUES ($1, $2)', [sessionId, username])
        res.json({ success: true, sessionId });
    }
    catch (err) {
        return res.status(400).json({ error: "username already exists" })

    }
};

//Login
export const login = async (req, res) => {
    const { userName, password } = req.body;
    const result = await pool.query('SELECT * FROM xenon_user WHERE username = $1 AND expiry_date > NOW()', [userName]);

    try {
        const user = result.rows[0];
        if (!user) {
            return res.status(400).json({ error: "Invalid Credentials" })
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Invalid Credentials" })
        }

        const now = new Date();
        if (user.expiry_date < now) {
            return res.status(401).json({ status: 'Account Expired' })
        }

        const checkses = await pool.query('SELECT * FROM sessions WHERE username = $1', [userName])
        if (checkses.rows.length > 0) {
            return res.status(400).json({ error: 'Another device is logged in' })
        }

        //creating automatic session
        const sessionId = crypto.randomBytes(10).toString('hex').toLowerCase();
        await pool.query('INSERT INTO sessions (session_id, username) VALUES ($1, $2)', [sessionId, userName])
        res.status(200).json({ sessionId })
    }
    catch (err) {
        console.error(err);
        return;
    }
};

//Autologin
export const autologin = async (req, res) => {
    try {
        const { sessionId } = req.body;

        const result = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [sessionId]);
        const sessionuser = result.rows[0];
        if (!sessionuser) {
            return res.status(400).json({ error: "Invalid Credentials" })
        }
        const user = sessionuser.username;
        const realuser = await pool.query('SELECT * FROM xenon_user WHERE username = $1', [user])
        if (!realuser.rows[0]) {
            return res.status(400).json({ error: 'User not found' })
        }
        const { username, role, expiry_date } = realuser.rows[0]
        const creator = await pool.query('SELECT * FROM download_logs WHERE creator = $1', [username])
        const creatorNum = creator.rows.length
        res.json({ username, role, expiry_date, creatorNum })
    }
    catch (err) {
        console.error(err);
        return;
    }
}
//Renew Suscription
export const renewSub = async (req, res) => {
    const { sessionId, newCode } = req.body;
    if (!sessionId || !newCode) {
        return res.status(400).json({ error: 'User not Logged in or Code Empty code input' });
    }
    try {
        const result = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [sessionId]);
        const sessionuser = result.rows[0];
        if (!sessionuser) {
            return res.status(400).json({ error: "Invalid Credentials" })
        }
        const user = sessionuser.username;
        const realuser = await pool.query('SELECT * FROM xenon_user WHERE username = $1', [user])
        if (!realuser.rows[0]) {
            return res.status(400).json({ error: 'User not found' })
        }
        const codeCheck = await pool.query('SELECT * FROM codes WHERE code_string = $1 AND is_used = false', [newCode]);
        if (codeCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Code does not exist' })
        }
        const { account_type } = codeCheck.rows[0];
        const { expiry_date, role } = realuser.rows[0];
        if (role !== account_type){
            return res.status(400).json({error: `Invalid code: You is a ${account_type.toLowerCase()} code but you are using a ${role.toLowerCase()} account`})
        }
        const currentExpiry = new Date(expiry_date)
        const now = new Date();
        let baseDate;
        if (currentExpiry < now) {
            baseDate = now;
        }
        else {
            baseDate = currentExpiry;
        }

        const newExpiryDate = new Date(baseDate);
        newExpiryDate.setDate(baseDate.getDate() + 30);
        await pool.query('UPDATE codes SET used_at = NOW(), is_used = true WHERE code_string = $1', [newCode])
        await pool.query('UPDATE xenon_user SET expiry_date = $1, signup_code = $2 WHERE username = $3', [newExpiryDate, newCode, user]);
        res.json({ success: true })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: 'Internal Server error' })
    }
}
//Logout
export const logout = async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(401).json({ error: 'You were never Logged in' });
        }
        await pool.query('DELETE FROM sessions WHERE session_id = $1', [sessionId]);
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Logout failed' });
    }
}

//ChangePassword
export const changePassword = async (req, res) => {

    const { sessionId, oldpass, newpass } = req.body;
    if (!sessionId || !newpass || !oldpass) {
        res.status(400).json({ error: 'Invalid credentials' })
    }
    try {
        const result = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [sessionId]);
        const sessionuser = result.rows[0];
        if (!sessionuser) {
            return res.status(400).json({ error: "User not LoggedIn" })
        }
        const user = sessionuser.username;

        const fetchPass = await pool.query('SELECT * FROM xenon_user WHERE username = $1', [user])
        const { password } = fetchPass.rows[0]
        const match = await bcrypt.compare(oldpass, password);
        if (!match) {
            return res.status(401).json({ error: "Old password is wrong" })
        }
        if (oldpass === newpass) {
            return res.status(400).json({ error: 'Password is the same tf?!' })
        }
        const hash = await bcrypt.hash(newpass, 10)
        await pool.query('UPDATE xenon_user SET password = $1 WHERE username = $2', [hash, user]);
        res.json({ success: true })
    }
    catch (err) {
        console.error(err.message);
    }
}
export const deleteAccount = async (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) {
        return res.status(400).json({ error: 'Not logged in' });
    }
    try {
        const result = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [sessionId]);
        const sessionuser = result.rows[0];
        if (!sessionuser) {
            return res.status(400).json({ error: "User not LoggedIn" })
        }
        const user = sessionuser.username;

        await pool.query('DELETE FROM xenon_user WHERE username = $1', [user]);
        await pool.query('DELETE FROM sessions WHERE session_id = $1', [sessionId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err.message)
    }
}