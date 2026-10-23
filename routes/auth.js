cat > routes/authors.js <<'EOF'
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


// GET /authors
router.get("/", async (req, res) => {
    try {
        const authors = await prisma.authors.findMany();

        const result = authors.map((author) => ({
            id: author.id.toString(),
            name: author.name,
            slug: createSlug(author.name)
        }));

        res.json(result);

    } catch (error) {
        console.error("ERROR AUTHORS:", error);

        res.status(500).json({
            message: "Gagal mengambil data authors"
        });
    }
});


// GET /authors/:slug
router.get("/:slug", async (req, res) => {
    try {
        const { slug } = req.params;

        if (!/^[a-z0-9-]+$/.test(slug)) {
            return res.status(400).json({
                message: "Format slug tidak valid"
            });
        }

        const authors = await prisma.authors.findMany({
            include: {
                books: true
            }
        });

        const author = authors.find(
            (item) => createSlug(item.name) === slug
        );

        if (!author) {
            return res.status(404).json({
                message: "Author tidak ditemukan"
            });
        }

        res.json({
            id: author.id.toString(),
            name: author.name,
            slug: createSlug(author.name),
            books: author.books.map((book) => ({
                id: book.id.toString(),
                title: book.title
            }))
        });

    } catch (error) {
        console.error("ERROR DETAIL AUTHOR:", error);

        res.status(500).json({
            message: "Gagal mengambil data author"
        });
    }
});


// POST /authors
router.post("/", async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Nama author wajib diisi"
            });
        }

        const author = await prisma.authors.create({
            data: {
                name
            }
        });

        res.status(201).json({
            id: author.id.toString(),
            name: author.name,
            slug: createSlug(author.name)
        });

    } catch (error) {
        console.error("ERROR CREATE AUTHOR:", error);

        res.status(500).json({
            message: "Gagal menambahkan author"
        });
    }
});


module.exports = router;
EOF