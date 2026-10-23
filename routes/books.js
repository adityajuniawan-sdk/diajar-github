
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
    return /^\d+$/.test(String(id));
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

        if (
            typeof title !== 'string' ||
            !title.trim() ||
            !validId(author_id)
        ) {
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

        let parsedYear = null;

        if (year !== undefined && year !== null && year !== '') {
            parsedYear = Number(year);

            if (!Number.isInteger(parsedYear) || parsedYear < 0) {
                return res.status(400).json({
                    pesan: 'Tahun tidak valid',
                    data: null
                });
            }
        }

        const book = await prisma.books.create({
            data: {
                title: title.trim(),
                author_id: BigInt(author_id),
                description: description || null,
                year: parsedYear
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

// PATCH /books/:id
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!validId(id)) {
            return res.status(400).json({
                pesan: 'ID buku tidak valid',
                data: null
            });
        }

        const existingBook = await prisma.books.findUnique({
            where: { id: BigInt(id) }
        });

        if (!existingBook) {
            return res.status(404).json({
                pesan: 'Buku tidak ditemukan',
                data: null
            });
        }

        const data = {};

        // Perbarui judul hanya jika dikirim
        if (req.body.title !== undefined) {
            if (
                typeof req.body.title !== 'string' ||
                !req.body.title.trim()
            ) {
                return res.status(400).json({
                    pesan: 'Judul buku wajib diisi',
                    data: null
                });
            }

            data.title = req.body.title.trim();
        }

        // Perbarui penulis hanya jika dikirim
        if (req.body.author_id !== undefined) {
            if (!validId(req.body.author_id)) {
                return res.status(400).json({
                    pesan: 'ID author tidak valid',
                    data: null
                });
            }

            const author = await prisma.authors.findUnique({
                where: { id: BigInt(req.body.author_id) }
            });

            if (!author) {
                return res.status(404).json({
                    pesan: 'Author tidak ditemukan',
                    data: null
                });
            }

            data.author_id = BigInt(req.body.author_id);
        }

        // Perbarui deskripsi hanya jika dikirim
        if (req.body.description !== undefined) {
            if (
                req.body.description !== null &&
                typeof req.body.description !== 'string'
            ) {
                return res.status(400).json({
                    pesan: 'Deskripsi tidak valid',
                    data: null
                });
            }

            data.description = req.body.description || null;
        }

        // Perbarui tahun hanya jika dikirim
        if (req.body.year !== undefined) {
            if (
                req.body.year !== null &&
                req.body.year !== '' &&
                (
                    !Number.isInteger(Number(req.body.year)) ||
                    Number(req.body.year) < 0
                )
            ) {
                return res.status(400).json({
                    pesan: 'Tahun tidak valid',
                    data: null
                });
            }

            data.year =
                req.body.year === null || req.body.year === ''
                    ? null
                    : Number(req.body.year);
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                pesan: 'Tidak ada data yang diperbarui',
                data: null
            });
        }

        const book = await prisma.books.update({
            where: { id: BigInt(id) },
            data
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
