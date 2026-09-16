import { readJson } from "./repositories/jsonRepository.js";

const books = await readJson("./data/books.json");

console.log("Jumlah buku:", books.length);
console.log("Buku pertama:", books[0].title);