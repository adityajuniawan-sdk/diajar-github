const express = require("express");
const router = express.Router();
const pool = require("../db");

// Menampilkan semua author
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name
            FROM authors
            ORDER BY id
        `);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil data author",
            error: error.message
        });
    }
});

// Menampilkan author berdasarkan ID
router.get("/:id", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name
            FROM authors
            WHERE id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Author tidak ditemukan"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil data author",
            error: error.message
        });
    }
});

module.exports = router;