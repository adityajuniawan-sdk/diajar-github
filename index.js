require('dotenv').config();

const express = require('express');
const cors = require('cors');
const prisma = require('./db');

const logger = require('./middleware/logger');
const authMiddleware = require('./middleware/auth');

const loginRoute = require('./routes/login');
const authorsRoute = require('./routes/authors');
const meRoute = require('./routes/me');

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

// ROOT
app.get('/', (req, res) => {
    res.json({
        pesan: 'Server ExpressJS berhasil berjalan!',
        data: null
    });
});

// BUAT SLUG
function createSlug(text) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// LOGIN: POST /login
app.use('/login', loginRoute);

// GET /books
app.get('/books', async (req, res) => {
    try {
        const books = await prisma.books.findMany({
            orderBy: { id: 'asc' }
        });

        const result = books.map(book => ({
            id: book.id.toString(),
            title: book.title,
            description: book.description,
            year: book.year,
            author_id: book.author_id.toString(),
            slug: createSlug(book.title)
        }));

        res.json({
            pesan: 'Data buku berhasil diambil',
            data: result
        });
    } catch (error) {
        console.error('ERROR BOOKS:', error);
        res.status(500).json({
            pesan: 'Gagal mengambil data buku',
            data: null
        });
    }
});

// GET /books/:slug
app.get('/books/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        if (!/^[a-z0-9-]+$/.test(slug)) {
            return res.status(400).json({
                pesan: 'Format slug tidak valid',
                data: null
            });
        }

        const books = await prisma.books.findMany({
            include: { authors: true }
        });

        const book = books.find(item => createSlug(item.title) === slug);

        if (!book) {
            return res.status(404).json({
                pesan: 'Buku tidak ditemukan',
                data: null
            });
        }

        res.json({
            pesan: 'Detail buku berhasil diambil',
            data: {
                id: book.id.toString(),
                title: book.title,
                description: book.description,
                year: book.year,
                author_id: book.author_id.toString(),
                slug: createSlug(book.title),
                author: {
                    id: book.authors.id.toString(),
                    name: book.authors.name
                }
            }
        });
    } catch (error) {
        console.error('ERROR DETAIL BOOK:', error);
        res.status(500).json({
            pesan: 'Gagal mengambil detail buku',
            data: null
        });
    }
});

// POST /books (wajib login)
app.post('/books', authMiddleware, async (req, res) => {
    try {
        const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
        const description = typeof req.body.description === 'string' ? req.body.description.trim() : null;
        const year = req.body.year === undefined || req.body.year === null ? null : Number(req.body.year);
        const authorId = req.body.author_id;

        if (!title) {
            return res.status(400).json({
                pesan: 'Judul buku wajib diisi',
                data: null
            });
        }

        if (title.length > 200) {
            return res.status(400).json({
                pesan: 'Judul maksimal 200 karakter',
                data: null
            });
        }

        if (year !== null && (!Number.isInteger(year) || year < 1000 || year > new Date().getFullYear())) {
            return res.status(400).json({
                pesan: 'Tahun tidak valid',
                data: null
            });
        }

        if (!authorId || !/^\d+$/.test(String(authorId))) {
            return res.status(400).json({
                pesan: 'author_id wajib diisi (angka)',
                data: null
            });
        }

        const author = await prisma.authors.findUnique({
            where: { id: BigInt(authorId) }
        });

        if (!author) {
            return res.status(404).json({
                pesan: 'Author tidak ditemukan',
                data: null
            });
        }

        const book = await prisma.books.create({
            data: {
                title,
                description,
                year,
                author_id: BigInt(authorId)
            }
        });

        res.status(201).json({
            pesan: 'Buku berhasil ditambahkan',
            data: {
                id: book.id.toString(),
                title: book.title,
                description: book.description,
                year: book.year,
                author_id: book.author_id.toString(),
                slug: createSlug(book.title)
            }
        });
    } catch (error) {
        console.error('ERROR CREATE BOOK:', error);
        res.status(500).json({
            pesan: 'Gagal menambahkan buku',
            data: null
        });
    }
});

// AUTHORS
// GET boleh tanpa login, selain GET (POST/PUT/DELETE) wajib token
app.use('/authors', (req, res, next) => {
    if (req.method === 'GET') return next();
    return authMiddleware(req, res, next);
});

app.use('/authors', authorsRoute);

// ME (JWT): GET /me
app.use('/me', meRoute);

// 404
app.use((req, res) => {
    res.status(404).json({
        pesan: 'Route tidak ditemukan',
        data: null
    });
});

// SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});