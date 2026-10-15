const express = require("express");
const router = express.Router();

const prisma = require("../db");
const authMiddleware = require("../middleware/auth");

router.get("/", authMiddleware, async (req, res) => {
    try {
        const user = await prisma.users.findUnique({
            where: {
                id: BigInt(req.user.sub)
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User tidak ditemukan"
            });
        }

        res.json({
            id: user.id.toString(),
            name: user.name,
            email: user.email
        });

    } catch (error) {
        res.status(500).json({
            message: "Gagal mengambil data user",
            error: error.message
        });
    }
});

module.exports = router;