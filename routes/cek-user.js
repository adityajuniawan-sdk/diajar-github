
require('dotenv').config();
const prisma = require('./db');

async function main() {
    const users = await prisma.users.findMany({
        select: {
            id: true,
            name: true,
            email: true
        }
    });

    console.log('DAFTAR AKUN:', users);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
