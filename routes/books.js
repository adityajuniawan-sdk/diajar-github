const express = require("express");
const router = express.Router();
const pool = require("../db");

// Menampilkan semua buku
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                books.id,
                books.title,
                authors.name AS author
            FROM books
            JOIN authors ON books.author_id = authors.id
            ORDER BY books.id
        `);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil data buku",
            error: error.message
        });
    }
});

// Menampilkan buku berdasarkan ID
router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                books.id,
                books.title,
                authors.name AS author
            FROM books
            JOIN authors ON books.author_id = authors.id
            WHERE books.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Buku tidak ditemukan"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil data buku",
            error: error.message
        });
    }
});

module.exports = router;