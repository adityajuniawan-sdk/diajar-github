const { buku, peminjaman } = require('./data');

const hasil = buku.map(b => {
    const jumlah = peminjaman.filter(
        p => p.bukuId === b.id && p.status === 'dipinjam'
    ).length;

    return {
        bukuId: b.id,
        judul: b.judul,
        dipinjamAktif: jumlah
    };
});

console.log(hasil);