const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                pesan: 'Email dan password wajib diisi',
                data: null
            });
        }

        const user = await prisma.users.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                pesan: 'Email atau password salah',
                data: null
            });
        }

        const passwordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordValid) {
            return res.status(401).json({
                pesan: 'Email atau password salah',
                data: null
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                pesan: 'JWT_SECRET belum dikonfigurasi',
                data: null
            });
        }

        const token = jwt.sign(
            { sub: user.id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.json({
            pesan: 'Login berhasil',
            data: {
                token,
                user: {
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email
                }
            }
        });
    } catch (error) {
        console.error('ERROR LOGIN:', error);

        return res.status(500).json({
            pesan: 'Terjadi kesalahan saat login',
            data: null
        });
    }
});

module.exports = router;