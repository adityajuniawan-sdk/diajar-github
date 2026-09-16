export class LibraryError extends Error {
  constructor(message) {
    super(message);
    this.name = "LibraryError";
  }
}

export class BookNotFoundError extends LibraryError {
  constructor() {
    super("Buku tidak ditemukan.");
    this.name = "BookNotFoundError";
  }
}

export class BookUnavailableError extends LibraryError {
  constructor() {
    super("Stok buku sedang habis.");
    this.name = "BookUnavailableError";
  }
}

export class LoanNotFoundError extends LibraryError {
  constructor() {
    super("Data peminjaman tidak ditemukan.");
    this.name = "LoanNotFoundError";
  }
}