const express = require('express');

const app = express();
const prisma = require('./db');

const logger = require('./middleware/logger');

const authorsRoute = require('./routes/authors');
const meRoute = require('./routes/me');

app.use(express.json());
app.use(logger);


// ==============================
// ROOT
// ==============================

app.get('/', (req, res) => {
    res.json({
        message: 'Server ExpressJS berhasil berjalan!'
    });
});


// ==============================
// BUAT SLUG
// ==============================

function createSlug(text) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}


// ==============================
// GET SEMUA BOOKS
// GET /books
// ==============================

app.get('/books', async (req, res) => {
    try {
        const books = await prisma.books.findMany();

        const result = books.map(book => ({
            id: book.id.toString(),
            title: book.title,
            author_id: Number(book.author_id),
            slug: createSlug(book.title)
        }));

        res.json(result);

    } catch (error) {
        console.error('ERROR BOOKS:', error);

        res.status(500).json({
            message: 'Gagal mengambil data books'
        });
    }
});


// ==============================
// DETAIL BOOK
// GET /books/:slug
// ==============================

app.get('/books/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        if (!/^[a-z0-9-]+$/.test(slug)) {
            return res.status(400).json({
                message: 'Format slug tidak valid'
            });
        }

        const books = await prisma.books.findMany();

        const book = books.find(
            item => createSlug(item.title) === slug
        );

        if (!book) {
            return res.status(404).json({
                message: 'Buku tidak ditemukan'
            });
        }

        res.json({
            id: book.id.toString(),
            title: book.title,
            author_id: Number(book.author_id),
            slug: createSlug(book.title)
        });

    } catch (error) {
        console.error('ERROR DETAIL BOOK:', error);

        res.status(500).json({
            message: 'Gagal mengambil detail buku'
        });
    }
});


// ==============================
// AUTHORS
// ==============================

app.use('/authors', authorsRoute);


// ==============================
// ME
// ==============================

app.use('/me', meRoute);


// ==============================
// 404
// ==============================

app.use((req, res) => {
    res.status(404).json({
        message: 'Route tidak ditemukan'
    });
});


// ==============================
// SERVER
// ==============================

app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});