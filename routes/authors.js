const express = require("express");
const router = express.Router();
const prisma = require("../db");

router.get("/", async (req, res) => {
    try {
        const authors = await prisma.authors.findMany();

        res.json(authors.map((author) => ({
            id: Number(author.id),
            name: author.name
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Gagal mengambil data authors"
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const author = await prisma.authors.findUnique({
            where: { id },
            include: { books: true }
        });

        if (!author) {
            return res.status(404).json({
                message: "Author tidak ditemukan"
            });
        }

        res.json({
            id: Number(author.id),
            name: author.name,
            books: author.books.map((book) => ({
                id: Number(book.id),
                title: book.title
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Gagal mengambil data author"
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { name } = req.body;

        const author = await prisma.authors.create({
            data: { name }
        });

        res.status(201).json({
            id: Number(author.id),
            name: author.name
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Gagal menambahkan author"
        });
    }
});

module.exports = router;