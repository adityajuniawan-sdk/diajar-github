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

// VALIDASI INPUT BUKU (dipakai POST dan PUT)
// Mengembalikan { error } kalau salah, atau { value } kalau benar
function validateBook(body) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : null;
    const year = body.year === undefined || body.year === null || body.year === ''
        ? null
        : Number(body.year);
    const authorId = body.author_id;

    if (!title) return { error: 'Judul buku wajib diisi' };
    if (title.length > 200) return { error: 'Judul maksimal 200 karakter' };

    if (year !== null && (!Number.isInteger(year) || year < 1000 || year > new Date().getFullYear())) {
        return { error: 'Tahun tidak valid' };
    }

    if (!authorId || !/^\d+$/.test(String(authorId))) {
        return { error: 'author_id wajib diisi (angka)' };
    }

    return { value: { title, description, year, authorId: BigInt(authorId) } };
}

function bookJson(book) {
    return {
        id: book.id.toString(),
        title: book.title,
        description: book.description,
        year: book.year,
        author_id: book.author_id.toString(),
        slug: createSlug(book.title)
    };
}

// LOGIN: POST /login
app.use('/login', loginRoute);

// GET /books
app.get('/books', async (req, res) => {
    try {
        const books = await prisma.books.findMany({
            orderBy: { id: 'asc' }
        });

        res.json({
            pesan: 'Data buku berhasil diambil',
            data: books.map(bookJson)
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
                ...bookJson(book),
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
        const result = validateBook(req.body);
        if (result.error) {
            return res.status(400).json({ pesan: result.error, data: null });
        }
        const { title, description, year, authorId } = result.value;

        const author = await prisma.authors.findUnique({ where: { id: authorId } });
        if (!author) {
            return res.status(404).json({ pesan: 'Author tidak ditemukan', data: null });
        }

        const book = await prisma.books.create({
            data: { title, description, year, author_id: authorId }
        });

        res.status(201).json({
            pesan: 'Buku berhasil ditambahkan',
            data: bookJson(book)
        });
    } catch (error) {
        console.error('ERROR CREATE BOOK:', error);
        res.status(500).json({ pesan: 'Gagal menambahkan buku', data: null });
    }
});

// PUT /books/:id (wajib login)
app.put('/books/:id', authMiddleware, async (req, res) => {
    try {
        if (!/^\d+$/.test(req.params.id)) {
            return res.status(400).json({ pesan: 'ID buku tidak valid', data: null });
        }
        const id = BigInt(req.params.id);

        const result = validateBook(req.body);
        if (result.error) {
            return res.status(400).json({ pesan: result.error, data: null });
        }
        const { title, description, year, authorId } = result.value;

        const existing = await prisma.books.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ pesan: 'Buku tidak ditemukan', data: null });
        }

        const author = await prisma.authors.findUnique({ where: { id: authorId } });
        if (!author) {
            return res.status(404).json({ pesan: 'Author tidak ditemukan', data: null });
        }

        const book = await prisma.books.update({
            where: { id },
            data: { title, description, year, author_id: authorId }
        });

        res.json({
            pesan: 'Buku berhasil diubah',
            data: bookJson(book)
        });
    } catch (error) {
        console.error('ERROR UPDATE BOOK:', error);
        res.status(500).json({ pesan: 'Gagal mengubah buku', data: null });
    }
});

// DELETE /books/:id (wajib login)
app.delete('/books/:id', authMiddleware, async (req, res) => {
    try {
        if (!/^\d+$/.test(req.params.id)) {
            return res.status(400).json({ pesan: 'ID buku tidak valid', data: null });
        }
        const id = BigInt(req.params.id);

        const existing = await prisma.books.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ pesan: 'Buku tidak ditemukan', data: null });
        }

        await prisma.books.delete({ where: { id } });

        res.json({ pesan: 'Buku berhasil dihapus', data: null });
    } catch (error) {
        console.error('ERROR DELETE BOOK:', error);
        res.status(500).json({ pesan: 'Gagal menghapus buku', data: null });
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