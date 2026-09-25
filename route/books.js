const express = require("express");
const router = express.Router();

const books = [
    {
        id: "B01",
        judul: "Clean Code",
        penulis: "Robert C. Martin"
    },
    {
        id: "B02",
        judul: "Atomic Habits",
        penulis: "James Clear"
    },
    {
        id: "B03",
        judul: "Eloquent JavaScript",
        penulis: "Marijn Haverbeke"
    }
];

router.get("/", (req, res) => {
    res.json(books);
});

module.exports = router;