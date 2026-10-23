const express = require("express");
const router = express.Router();

const me = [
    {
        nama: "Adit",
        kelas: "XI PPLG",
        jurusan: "PPLG"
    }
];

router.get("/", (req, res) => {
    res.json(me);
});

module.exports = router;