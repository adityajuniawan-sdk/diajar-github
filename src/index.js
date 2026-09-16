import readline from "readline";

import {
  getAllBooks,
  getAllAuthors
} from "./services/bookService.js";

import {
  getAllLoans,
  createLoan,
  returnBook
} from "./services/loanService.js";

import {
  formatBooks,
  formatLoans
} from "./utils/reportFormatter.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function tanya(pertanyaan) {
  return new Promise((resolve) => {
    rl.question(pertanyaan, resolve);
  });
}

async function main() {
  while (true) {
    console.log("\n===== MENU PERPUSTAKAAN =====");
    console.log("1. Daftar buku");
    console.log("2. Cari buku");
    console.log("3. Pinjam buku");
    console.log("4. Kembalikan buku");
    console.log("5. Laporan");
    console.log("0. Keluar");

    const pilihan = await tanya("Pilih menu: ");

    if (pilihan === "1") {
      try {
        const books = await getAllBooks();
        const authors = await getAllAuthors();

        console.log("\n===== DAFTAR BUKU =====");

        if (books.length === 0) {
          console.log("Data buku kosong.");
        } else {
          console.log(formatBooks(books, authors));
        }
      } catch (error) {
        console.log("Gagal menampilkan buku:", error.message);
      }
    }

    else if (pilihan === "2") {
      const id = await tanya("Masukkan ID buku: ");

      try {
        const books = await getAllBooks();

        const book = books.find(
          (item) => item.id === Number(id)
        );

        if (book) {
          console.log("\n===== BUKU DITEMUKAN =====");
          console.log(book);
        } else {
          console.log("Buku tidak ditemukan.");
        }
      } catch (error) {
        console.log("Gagal mencari buku:", error.message);
      }
    }

    else if (pilihan === "3") {
      const bookId = await tanya("ID buku: ");
      const borrower = await tanya("Nama peminjam: ");

      const date = new Date()
        .toISOString()
        .split("T")[0];

      try {
        const loan = await createLoan({
          bookId: Number(bookId),
          borrower,
          date
        });

        console.log("\nPeminjaman berhasil!");
        console.log(loan);
      } catch (error) {
        console.log("\nError:", error.message);
      }
    }

    else if (pilihan === "4") {
      const loanId = await tanya(
        "Masukkan ID peminjaman: "
      );

      try {
        const loan = await returnBook(Number(loanId));

        console.log("\nBuku berhasil dikembalikan!");
        console.log(loan);
      } catch (error) {
        console.log("\nError:", error.message);
      }
    }

    else if (pilihan === "5") {
      try {
        console.log("\n===== LAPORAN =====");

        const books = await getAllBooks();
        const authors = await getAllAuthors();
        const loans = await getAllLoans();

        console.log("\n--- DATA BUKU ---");

        if (books.length === 0) {
          console.log("Tidak ada data buku.");
        } else {
          console.log(formatBooks(books, authors));
        }

        console.log("\n--- DATA PEMINJAMAN ---");

        if (loans.length === 0) {
          console.log("Belum ada data peminjaman.");
        } else {
          console.log(formatLoans(loans, books));
        }

      } catch (error) {
        console.log("\nGagal membuat laporan!");
        console.log("Error:", error.message);
      }
    }

    else if (pilihan === "0") {
      console.log("\nProgram selesai.");
      break;
    }

    else {
      console.log("\nPilihan tidak tersedia.");
    }
  }

  rl.close();
}

main(); 