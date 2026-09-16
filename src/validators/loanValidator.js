export function validateLoan(data) {
  if (!data.bookId) {
    throw new Error("bookId wajib diisi.");
  }

  if (!data.borrower) {
    throw new Error("Nama peminjam wajib diisi.");
  }

  if (!data.date) {
    throw new Error("Tanggal peminjaman wajib diisi.");
  }

  return true;
}