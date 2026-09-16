import {
  readJson,
  writeJson
} from "../repositories/jsonRepository.js";

import {
  BookNotFoundError,
  BookUnavailableError
} from "../utils/errors.js";

import { validateLoan } from "../validators/loanValidator.js";

import { getAllBooks } from "./bookService.js";

const loansPath = new URL("../../data/loans.json", import.meta.url);
const booksPath = new URL("../../data/books.json", import.meta.url);

export async function getAllLoans() {
  return await readJson(loansPath);
}

export async function createLoan(data) {
  validateLoan(data);

  const books = await getAllBooks();

  const book = books.find(
    (item) => item.id === Number(data.bookId)
  );

  if (!book) {
    throw new BookNotFoundError();
  }

  if (book.stock <= 0) {
    throw new BookUnavailableError();
  }

  const loans = await getAllLoans();

  const newLoan = {
    id: loans.length + 1,
    bookId: Number(data.bookId),
    borrower: data.borrower,
    date: data.date,
    returned: false
  };

  loans.push(newLoan);

  book.stock--;

  await writeJson(loansPath, loans);
  await writeJson(booksPath, books);

  return newLoan;
}

export async function returnBook(loanId) {
  const loans = await getAllLoans();

  const loan = loans.find(
    (item) => item.id === Number(loanId)
  );

  if (!loan) {
    throw new Error("Peminjaman tidak ditemukan.");
  }

  if (loan.returned) {
    throw new Error("Buku sudah dikembalikan.");
  }

  const books = await getAllBooks();

  const book = books.find(
    (item) => item.id === loan.bookId
  );

  if (book) {
    book.stock++;
  }

  loan.returned = true;

  await writeJson(loansPath, loans);
  await writeJson(booksPath, books);

  return loan;
}