const express = require('express');
const bcrypt = require('bcrypt');

const prisma = require('../db');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { nama, email, password } = req.body;

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.users.create({
            data: {
                nama: nama,
                email: email,
                password: passwordHash
            }
        });

        res.status(201).json({
            message: 'Register berhasil',
            user: {
                id: user.id,
                nama: user.nama,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Register gagal',
            error: error.message
        });
    }
});

module.exports = router;