
const express = require('express');
const router = express.Router();
const prisma = require('../db');

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
// VALIDASI ID AUTHOR
// ========================================

function isValidId(id) {
    return /^\d+$/.test(String(id));
}

// ========================================
// FORMAT DATA AUTHOR
// ========================================

function authorJson(author, totalBooks) {
    return {
        id: author.id.toString(),
        name: author.name,
        slug: createSlug(author.name),
        total_books: totalBooks
    };
}

// ========================================
// GET /authors
// Mengambil semua author dan jumlah bukunya
// ========================================

router.get('/', async (req, res) => {
    try {
        const authors = await prisma.authors.findMany({
            include: {
                books: {
                    select: {
                        id: true
                    }
                }
            },
            orderBy: {
                id: 'asc'
            }
        });

        const data = authors.map(author =>
            authorJson(author, author.books.length)
        );

        return res.json({
            pesan: 'Berhasil mengambil data author',
            data
        });
    } catch (error) {
        console.error('ERROR GET AUTHORS:', error);

        return res.status(500).json({
            pesan: 'Gagal mengambil data author',
            data: null
        });
    }
});

// ========================================
// GET /authors/:slug
// Detail author dan daftar bukunya
// ========================================

router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        if (!/^[a-z0-9-]+$/.test(slug)) {
            return res.status(400).json({
                pesan: 'Format slug tidak valid',
                data: null
            });
        }

        const authors = await prisma.authors.findMany({
            include: {
                books: {
                    select: {
                        id: true,
                        title: true
                    },
                    orderBy: {
                        id: 'asc'
                    }
                }
            }
        });

        const author = authors.find(
            item => createSlug(item.name) === slug
        );

        if (!author) {
            return res.status(404).json({
                pesan: 'Author tidak ditemukan',
                data: null
            });
        }

        return res.json({
            pesan: 'Berhasil mengambil detail author',
            data: {
                ...authorJson(author, author.books.length),
                books: author.books.map(book => ({
                    id: book.id.toString(),
                    title: book.title
                }))
            }
        });
    } catch (error) {
        console.error('ERROR DETAIL AUTHOR:', error);

        return res.status(500).json({
            pesan: 'Gagal mengambil detail author',
            data: null
        });
    }
});

// ========================================
// POST /authors
// Menambahkan author
// Wajib login melalui middleware index.js
// ========================================

router.post('/', async (req, res) => {
    try {
        const name =
            typeof req.body.name === 'string'
                ? req.body.name.trim()
                : '';

        if (!name) {
            return res.status(400).json({
                pesan: 'Nama author wajib diisi',
                data: null
            });
        }

        if (name.length > 100) {
            return res.status(400).json({
                pesan: 'Nama author maksimal 100 karakter',
                data: null
            });
        }

        const author = await prisma.authors.create({
            data: {
                name
            }
        });

        return res.status(201).json({
            pesan: 'Author berhasil ditambahkan',
            data: authorJson(author, 0)
        });
    } catch (error) {
        console.error('ERROR CREATE AUTHOR:', error);

        return res.status(500).json({
            pesan: 'Gagal menambahkan author',
            data: null
        });
    }
});

// ========================================
// PATCH /authors/:id
// Mengedit author
// Wajib login melalui middleware index.js
// ========================================

router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                pesan: 'ID author tidak valid',
                data: null
            });
        }

        const authorId = BigInt(id);

        const name =
            typeof req.body.name === 'string'
                ? req.body.name.trim()
                : '';

        if (!name) {
            return res.status(400).json({
                pesan: 'Nama author wajib diisi',
                data: null
            });
        }

        if (name.length > 100) {
            return res.status(400).json({
                pesan: 'Nama author maksimal 100 karakter',
                data: null
            });
        }

        const existingAuthor = await prisma.authors.findUnique({
            where: {
                id: authorId
            },
            include: {
                books: {
                    select: {
                        id: true
                    }
                }
            }
        });

        if (!existingAuthor) {
            return res.status(404).json({
                pesan: 'Author tidak ditemukan',
                data: null
            });
        }

        const author = await prisma.authors.update({
            where: {
                id: authorId
            },
            data: {
                name
            },
            include: {
                books: {
                    select: {
                        id: true
                    }
                }
            }
        });

        return res.json({
            pesan: 'Author berhasil diperbarui',
            data: authorJson(author, author.books.length)
        });
    } catch (error) {
        console.error('ERROR UPDATE AUTHOR:', error);

        return res.status(500).json({
            pesan: 'Gagal memperbarui author',
            data: null
        });
    }
});

// ========================================
// DELETE /authors/:id
// Menghapus author yang tidak memiliki buku
// Wajib login melalui middleware index.js
// ========================================

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                pesan: 'ID author tidak valid',
                data: null
            });
        }

        const authorId = BigInt(id);

        const author = await prisma.authors.findUnique({
            where: {
                id: authorId
            },
            include: {
                books: {
                    select: {
                        id: true
                    }
                }
            }
        });

        if (!author) {
            return res.status(404).json({
                pesan: 'Author tidak ditemukan',
                data: null
            });
        }

        if (author.books.length > 0) {
            return res.status(409).json({
                pesan: 'Author masih memiliki buku. Hapus atau pindahkan bukunya terlebih dahulu.',
                data: null
            });
        }

        await prisma.authors.delete({
            where: {
                id: authorId
            }
        });

        return res.json({
            pesan: 'Author berhasil dihapus',
            data: {
                id: author.id.toString(),
                name: author.name
            }
        });
    } catch (error) {
        console.error('ERROR DELETE AUTHOR:', error);

        return res.status(500).json({
            pesan: 'Gagal menghapus author',
            data: null
        });
    }
});

module.exports = router;
