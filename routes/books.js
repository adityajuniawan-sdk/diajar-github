const express = require('express');
const router = express.Router();

const prisma = require('../db');
const validateSlug = require('../middleware/validate');

console.log('BOOKS ROUTE BARU AKTIF');

function createSlug(text) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// GET /books
router.get('/', async (req, res) => {
    try {
        const books = await prisma.books.findMany();

        const result = books.map((book) => ({
            id: book.id.toString(),
            judul: book.judul,
            author_id: book.author_id,
            slug: createSlug(book.judul)
        }));

        res.json(result);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Gagal mengambil data books'
        });
    }
});

// GET /books/:slug
router.get('/:slug', validateSlug, async (req, res) => {
    try {
        const { slug } = req.params;

        const books = await prisma.books.findMany();

        const book = books.find(
            (item) => createSlug(item.judul) === slug
        );

        if (!book) {
            return res.status(404).json({
                message: 'Buku tidak ditemukan'
            });
        }

        res.json({
            id: book.id.toString(),
            judul: book.judul,
            author_id: book.author_id,
            slug: createSlug(book.judul)
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Gagal mengambil detail buku'
        });
    }
});

module.exports = router;