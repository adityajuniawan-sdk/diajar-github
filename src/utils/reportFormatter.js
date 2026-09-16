export function formatBooks(books, authors) {
  let result = "";

  books.forEach((book) => {
    const author = authors.find(
      (author) => author.id === book.authorId
    );

    result += `
ID     : ${book.id}
Judul  : ${book.title}
Penulis: ${author ? author.name : "-"}
Tahun  : ${book.year}
Stok   : ${book.stock}
-------------------------
`;
  });

  return result;
}

export function formatLoans(loans, books) {
  let result = "";

  loans.forEach((loan) => {
    const book = books.find(
      (book) => book.id === Number(loan.bookId)
    );

    result += `
ID Peminjaman : ${loan.id}
Buku          : ${book ? book.title : "-"}
Peminjam      : ${loan.borrower}
Tanggal       : ${loan.date}
Status        : ${loan.status}
-------------------------
`;
  });

  return result;
}