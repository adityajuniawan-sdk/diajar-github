import {
  readJson
} from "../repositories/jsonRepository.js";

const BOOKS_FILE = "./data/books.json";
const AUTHORS_FILE = "./data/authors.json";

export async function getAllBooks() {
  return await readJson(BOOKS_FILE);
}

export async function getAllAuthors() {
  return await readJson(AUTHORS_FILE);
}