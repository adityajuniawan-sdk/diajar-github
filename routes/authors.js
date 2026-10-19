const express = require("express");
const router = express.Router();
const prisma = require("../db");

function createSlug(text) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

// GET /authors - Mengambil semua author dan jumlah bukunya
router.get("/", async (req, res) => {
    try {
        const authors = await prisma.authors.findMany({
            include: {
                books: {
                    select: { id: true }
                }
            }
        });

        const data = authors.map((author) => ({
            id: author.id.toString(),
            name: author.name,
            slug: createSlug(author.name),
            total_books: author.books.length
        }));

        res.json({
            pesan: "Berhasil mengambil data author",
            data
        });
    } catch (error) {
        console.error("ERROR GET AUTHORS:", error);
        res.status(500).json({
            pesan: "Gagal mengambil data author",
            data: null
        });
    }
});

// GET /authors/:slug - Mengambil detail author dan bukunya
router.get("/:slug", async (req, res) => {
    try {
        const { slug } = req.params;

        if (!/^[a-z0-9-]+$/.test(slug)) {
            return res.status(400).json({
                pesan: "Format slug tidak valid",
                data: null
            });
        }

        const authors = await prisma.authors.findMany({
            include: {
                books: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        const author = authors.find(
            (item) => createSlug(item.name) === slug
        );

        if (!author) {
            return res.status(404).json({
                pesan: "Author tidak ditemukan",
                data: null
            });
        }

        res.json({
            pesan: "Berhasil mengambil detail author",
            data: {
                id: author.id.toString(),
                name: author.name,
                slug: createSlug(author.name),
                total_books: author.books.length,
                books: author.books.map((book) => ({
                    id: book.id.toString(),
                    title: book.title
                }))
            }
        });
    } catch (error) {
        console.error("ERROR DETAIL AUTHOR:", error);
        res.status(500).json({
            pesan: "Gagal mengambil detail author",
            data: null
        });
    }
});

// POST /authors - Menambahkan author
router.post("/", async (req, res) => {
    try {
        const name =
            typeof req.body.name === "string"
                ? req.body.name.trim()
                : "";

        if (!name || name.length > 100) {
            return res.status(400).json({
                pesan: "Nama author wajib diisi dan maksimal 100 karakter",
                data: null
            });
        }

        const author = await prisma.authors.create({
            data: { name }
        });

        res.status(201).json({
            pesan: "Author berhasil ditambahkan",
            data: {
                id: author.id.toString(),
                name: author.name,
                slug: createSlug(author.name),
                total_books: 0
            }
        });
    } catch (error) {
        console.error("ERROR CREATE AUTHOR:", error);
        res.status(500).json({
            pesan: "Gagal menambahkan author",
            data: null
        });
    }
});

// PUT /authors/:id - Mengedit author
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const name =
            typeof req.body.name === "string"
                ? req.body.name.trim()
                : "";

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                pesan: "ID author tidak valid",
                data: null
            });
        }

        if (!name || name.length > 100) {
            return res.status(400).json({
                pesan: "Nama author wajib diisi dan maksimal 100 karakter",
                data: null
            });
        }

        const existingAuthor = await prisma.authors.findUnique({
            where: { id: BigInt(id) }
        });

        if (!existingAuthor) {
            return res.status(404).json({
                pesan: "Author tidak ditemukan",
                data: null
            });
        }

        const author = await prisma.authors.update({
            where: { id: BigInt(id) },
            data: { name }
        });

        res.json({
            pesan: "Author berhasil diperbarui",
            data: {
                id: author.id.toString(),
                name: author.name,
                slug: createSlug(author.name)
            }
        });
    } catch (error) {
        console.error("ERROR UPDATE AUTHOR:", error);
        res.status(500).json({
            pesan: "Gagal memperbarui author",
            data: null
        });
    }
});

// DELETE /authors/:id - Menghapus author
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                pesan: "ID author tidak valid",
                data: null
            });
        }

        const author = await prisma.authors.findUnique({
            where: { id: BigInt(id) },
            include: {
                books: {
                    select: { id: true }
                }
            }
        });

        if (!author) {
            return res.status(404).json({
                pesan: "Author tidak ditemukan",
                data: null
            });
        }

        if (author.books.length > 0) {
            return res.status(409).json({
                pesan: "Author masih memiliki buku. Hapus atau pindahkan bukunya terlebih dahulu.",
                data: null
            });
        }

        await prisma.authors.delete({
            where: { id: BigInt(id) }
        });

        res.json({
            pesan: "Author berhasil dihapus",
            data: {
                id: author.id.toString(),
                name: author.name
            }
        });
    } catch (error) {
        console.error("ERROR DELETE AUTHOR:", error);
        res.status(500).json({
            pesan: "Gagal menghapus author",
            data: null
        });
    }
});

module.exports = router;