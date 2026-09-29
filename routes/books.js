const express = require("express");
const router = express.Router();
const prisma = require("../db");

router.get("/", async (req, res) => {
    try {
        const books = await prisma.books.findMany({
            include: {
                authors: true
            }
        });

        const data = books.map((book) => ({
            id: Number(book.id),
            title: book.title,
            author: {
                id: Number(book.authors.id),
                name: book.authors.name
            }
        }));

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Gagal mengambil data books"
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const id = BigInt(req.params.id);

        const book = await prisma.books.findUnique({
            where: {
                id: id
            },
            include: {
                authors: true
            }
        });

        if (!book) {
            return res.status(404).json({
                message: "Buku tidak ditemukan"
            });
        }

        res.json({
            id: Number(book.id),
            title: book.title,
            author: {
                id: Number(book.authors.id),
                name: book.authors.name
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Gagal mengambil data buku"
        });
    }
});


router.post("/", async (req, res) => {
    try {
        const { title, author_id } = req.body;

        const book = await prisma.books.create({
            data: {
                title: title,
                author_id: BigInt(author_id)
            }
        });

        res.status(201).json({
            id: Number(book.id),
            title: book.title,
            author_id: Number(book.author_id)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Gagal menambahkan buku"
        });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const id = BigInt(req.params.id);
        const { title, author_id } = req.body;

        const book = await prisma.books.update({
            where: {
                id: id
            },
            data: {
                title: title,
                author_id: BigInt(author_id)
            }
        });

        res.json({
            id: Number(book.id),
            title: book.title,
            author_id: Number(book.author_id)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Gagal mengubah data buku"
        });
    }
});

module.exports = router;