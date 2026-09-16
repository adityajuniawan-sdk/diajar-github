const { buku, peminjaman } = require('./data');

function pinjamBuku(bukuId, namaPeminjam) {
    const b = buku.find(b => b.id === bukuId);

    if (!b) {
        return 'Buku tidak ditemukan';
    }

    if (!namaPeminjam || namaPeminjam.trim() === '') {
        return 'Nama peminjam kosong';
    }

    if (b.stok <= 0) {
        return 'Stok buku habis';
    }

    b.stok--;

    peminjaman.push({
        id: 'L' + (peminjaman.length + 1),
        bukuId: bukuId,
        namaPeminjam: namaPeminjam,
        status: 'dipinjam'
    });

    return 'Peminjaman berhasil';
}

console.log(pinjamBuku('B01', 'Dani'));
console.log(pinjamBuku('B99', 'Dani'));
console.log(pinjamBuku('B01', ''));