import express from 'express';
import cors from 'cors';
import masterRoute from './routes/routesIndex.js'
import path from 'path'
import deleteExpiredMovies from './services/deleteMovies.js';
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const PORT = 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.resolve(__dirname, '../public')))
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))
app.use(express.json());

app.use('/', masterRoute)


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on ${PORT}`);

    deleteExpiredMovies();
    setInterval(deleteExpiredMovies, 1000 * 60 * 60);
})