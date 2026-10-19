
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const prisma = require('./db');

const logger = require('./middleware/logger');
const authMiddleware = require('./middleware/auth');

const loginRoute = require('./routes/login');
const authorsRoute = require('./routes/authors');
const meRoute = require('./routes/me');

const app = express();

// ========================================
// KONFIGURASI
// ========================================

app.use(cors());
app.use(express.json());
app.use(logger);

// ========================================
// FRONTEND RAK BUKU
// localhost:3000 langsung membuka website
// ========================================

const frontendPath = path.join(
    process.env.USERPROFILE || process.env.HOME,
    'Downloads',
    'frontend-buku (2)',
    'frontend-buku'
);

app.use(express.static(frontendPath));

// ROOT
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ========================================
// HELPER SLUG
// ========================================

function createSlug(text) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// ========================================
// VALIDASI BUKU
// ========================================

function validateBook(body) {
    const title =
        typeof body.title === 'string'
            ? body.title.trim()
            : '';

    const description =
        typeof body.description === 'string'
            ? body.description.trim()
            : null;

    const year =
        body.year === undefined ||
        body.year === null ||
        body.year === ''
            ? null
            : Number(body.year);

    const authorId = body.author_id;

    if (!title) {
        return { error: 'Judul buku wajib diisi' };
    }

    if (title.length > 200) {
        return { error: 'Judul maksimal 200 karakter' };
    }

    if (
        year !== null &&
        (
            !Number.isInteger(year) ||
            year < 1000 ||
            year > new Date().getFullYear()
        )
    ) {
        return { error: 'Tahun tidak valid' };
    }

    if (!authorId || !/^\d+$/.test(String(authorId))) {
        return { error: 'author_id wajib diisi (angka)' };
    }

    return {
        value: {
            title,
            description,
            year,
            authorId: BigInt(authorId)
        }
    };
}

// ========================================
// FORMAT DATA BUKU
// ========================================

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

// ========================================
// LOGIN
// ========================================

app.use('/login', loginRoute);

// ========================================
// DAFTAR BUKU
// GET /books
// ========================================

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

// ========================================
// DETAIL BUKU
// GET /books/:slug
// ========================================

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

        const book = books.find(
            item => createSlug(item.title) === slug
        );

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

// ========================================
// TAMBAH BUKU
// POST /books
// Wajib login
// ========================================

app.post('/books', authMiddleware, async (req, res) => {
    try {
        const result = validateBook(req.body);

        if (result.error) {
            return res.status(400).json({
                pesan: result.error,
                data: null
            });
        }

        const { title, description, year, authorId } = result.value;

        const author = await prisma.authors.findUnique({
            where: { id: authorId }
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
                author_id: authorId
            }
        });

        res.status(201).json({
            pesan: 'Buku berhasil ditambahkan',
            data: bookJson(book)
        });
    } catch (error) {
        console.error('ERROR CREATE BOOK:', error);

        res.status(500).json({
            pesan: 'Gagal menambahkan buku',
            data: null
        });
    }
});

// ========================================
// EDIT BUKU
// PUT /books/:id
// Wajib login
// ========================================

app.put('/books/:id', authMiddleware, async (req, res) => {
    try {
        if (!/^\d+$/.test(req.params.id)) {
            return res.status(400).json({
                pesan: 'ID buku tidak valid',
                data: null
            });
        }

        const id = BigInt(req.params.id);
        const result = validateBook(req.body);

        if (result.error) {
            return res.status(400).json({
                pesan: result.error,
                data: null
            });
        }

        const { title, description, year, authorId } = result.value;

        const existing = await prisma.books.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({
                pesan: 'Buku tidak ditemukan',
                data: null
            });
        }

        const author = await prisma.authors.findUnique({
            where: { id: authorId }
        });

        if (!author) {
            return res.status(404).json({
                pesan: 'Author tidak ditemukan',
                data: null
            });
        }

        const book = await prisma.books.update({
            where: { id },
            data: {
                title,
                description,
                year,
                author_id: authorId
            }
        });

        res.json({
            pesan: 'Buku berhasil diubah',
            data: bookJson(book)
        });
    } catch (error) {
        console.error('ERROR UPDATE BOOK:', error);

        res.status(500).json({
            pesan: 'Gagal mengubah buku',
            data: null
        });
    }
});

// ========================================
// HAPUS BUKU
// DELETE /books/:id
// Wajib login
// ========================================

app.delete('/books/:id', authMiddleware, async (req, res) => {
    try {
        if (!/^\d+$/.test(req.params.id)) {
            return res.status(400).json({
                pesan: 'ID buku tidak valid',
                data: null
            });
        }

        const id = BigInt(req.params.id);

        const existing = await prisma.books.findUnique({
            where: { id }
        });

        if (!existing) {
            return res.status(404).json({
                pesan: 'Buku tidak ditemukan',
                data: null
            });
        }

        await prisma.books.delete({
            where: { id }
        });

        res.json({
            pesan: 'Buku berhasil dihapus',
            data: null
        });
    } catch (error) {
        console.error('ERROR DELETE BOOK:', error);

        res.status(500).json({
            pesan: 'Gagal menghapus buku',
            data: null
        });
    }
});

// ========================================
// PENULIS
// GET boleh tanpa login
// Metode selain GET wajib login
// ========================================

app.use('/authors', (req, res, next) => {
    if (req.method === 'GET') {
        return next();
    }

    return authMiddleware(req, res, next);
});

app.use('/authors', authorsRoute);

// ========================================
// PROFIL USER
// GET /me
// ========================================

app.use('/me', meRoute);

// ========================================
// ROUTE TIDAK DITEMUKAN
// ========================================

app.use((req, res) => {
    res.status(404).json({
        pesan: 'Route tidak ditemukan',
        data: null
    });
});

// ========================================
// JALANKAN SERVER
// ========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Frontend: ${frontendPath}`);
});
