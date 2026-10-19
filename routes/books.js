const express = require('express');
const router = express.Router();
const prisma = require('../db');
const validateSlug = require('../middleware/validate');

function createSlug(text) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function validId(id) {
    return /^\d+$/.test(id);
}

// GET /books
router.get('/', async (req, res) => {
    try {
        const books = await prisma.books.findMany({
            include: { authors: true }
        });

        res.json({
            pesan: 'Berhasil mengambil data buku',
            data: books.map(book => ({
                id: book.id.toString(),
                title: book.title,
                description: book.description,
                year: book.year,
                author_id: book.author_id.toString(),
                author: book.authors,
                slug: createSlug(book.title)
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            pesan: 'Gagal mengambil data buku',
            data: null
        });
    }
});

// GET /books/:slug
router.get('/:slug', validateSlug, async (req, res) => {
    try {
        const books = await prisma.books.findMany({
            include: { authors: true }
        });

        const book = books.find(
            item => createSlug(item.title) === req.params.slug
        );

        if (!book) {
            return res.status(404).json({
                pesan: 'Buku tidak ditemukan',
                data: null
            });
        }

        res.json({
            pesan: 'Berhasil mengambil detail buku',
            data: {
                id: book.id.toString(),
                title: book.title,
                description: book.description,
                year: book.year,
                author_id: book.author_id.toString(),
                author: book.authors,
                slug: createSlug(book.title)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            pesan: 'Gagal mengambil detail buku',
            data: null
        });
    }
});

// POST /books
router.post('/', async (req, res) => {
    try {
        const { title, author_id, description, year } = req.body;

        if (!title?.trim() || !validId(String(author_id ?? ''))) {
            return res.status(400).json({
                pesan: 'Judul dan author wajib diisi',
                data: null
            });
        }

        const author = await prisma.authors.findUnique({
            where: { id: BigInt(author_id) }
        });

        if (!author) {
            return res.status(404).json({
                pesan: 'Author tidak ditemukan',
                data: null
            });
        }

        const book = await prisma.books.create({
            data: {
                title: title.trim(),
                author_id: BigInt(author_id),
                description: description || null,
                year: year ? Number(year) : null
            }
        });

        res.status(201).json({
            pesan: 'Buku berhasil ditambahkan',
            data: {
                id: book.id.toString(),
                title: book.title,
                slug: createSlug(book.title)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            pesan: 'Gagal menambahkan buku',
            data: null
        });
    }
});

// PUT /books/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author_id, description, year } = req.body;

        if (!validId(id)) {
            return res.status(400).json({
                pesan: 'ID buku tidak valid',
                data: null
            });
        }

        if (!title?.trim() || !validId(String(author_id ?? ''))) {
            return res.status(400).json({
                pesan: 'Judul dan author wajib diisi',
                data: null
            });
        }

        const bookId = BigInt(id);
        const authorId = BigInt(author_id);

        const existingBook = await prisma.books.findUnique({
            where: { id: bookId }
        });

        if (!existingBook) {
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
            where: { id: bookId },
            data: {
                title: title.trim(),
                author_id: authorId,
                description: description || null,
                year: year ? Number(year) : null
            }
        });

        res.json({
            pesan: 'Buku berhasil diperbarui',
            data: {
                id: book.id.toString(),
                title: book.title,
                slug: createSlug(book.title)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            pesan: 'Gagal memperbarui buku',
            data: null
        });
    }
});

// DELETE /books/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                pesan: 'ID buku tidak valid',
                data: null
            });
        }

        const book = await prisma.books.findUnique({
            where: { id: BigInt(id) }
        });

        if (!book) {
            return res.status(404).json({
                pesan: 'Buku tidak ditemukan',
                data: null
            });
        }

        await prisma.books.delete({
            where: { id: BigInt(id) }
        });

        res.json({
            pesan: 'Buku berhasil dihapus',
            data: { id }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            pesan: 'Gagal menghapus buku',
            data: null
        });
    }
});

module.exports = router;