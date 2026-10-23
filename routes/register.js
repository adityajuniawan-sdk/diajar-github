
const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                pesan: 'Nama, email, dan password wajib diisi',
                data: null
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (password.length < 8) {
            return res.status(400).json({
                pesan: 'Password minimal 8 karakter',
                data: null
            });
        }

        const existingUser = await prisma.users.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            return res.status(409).json({
                pesan: 'Email sudah terdaftar',
                data: null
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.users.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword
            }
        });

        return res.status(201).json({
            pesan: 'Registrasi berhasil',
            data: {
                id: user.id.toString(),
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('ERROR REGISTER:', error);

        if (error.code === 'P2002') {
            return res.status(409).json({
                pesan: 'Email sudah terdaftar',
                data: null
            });
        }

        return res.status(500).json({
            pesan: 'Terjadi kesalahan saat registrasi',
            data: null
        });
    }
});

module.exports = router;
