require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('./db');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Masukkan password akun aditya@mail.com: ', async (password) => {
    try {
        const user = await prisma.users.findUnique({
            where: { email: 'aditya@mail.com' },
            select: { password: true }
        });

        if (!user) {
            console.log('Akun tidak ditemukan');
        } else {
            const cocok = await bcrypt.compare(password, user.password);
            console.log('Password cocok:', cocok);
        }
    } catch (error) {
        console.error('Tes gagal:', error.message);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
});
