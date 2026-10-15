const prisma = require("./db");

async function main() {
    const authors = await prisma.authors.findMany();
    const books = await prisma.books.findMany();

    console.log("AUTHORS:");
    console.log(authors);

    console.log("BOOKS:");
    console.log(books);
}

main()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });