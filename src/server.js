import express from 'express';
import { fileURLToPath } from 'node:url';

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', fileURLToPath(new URL('./views/', import.meta.url)));

app.use(express.static(fileURLToPath(new URL('./public/', import.meta.url))));

app.get('/', (req, res) => {
    res.render('home');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Luma is running on port ${port}`);
});