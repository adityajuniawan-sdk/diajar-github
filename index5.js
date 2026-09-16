const { penulis, buku, peminjaman } = require('./data');

function totalJudul() {
    return buku.length;
}

function totalStok() {
    return buku.reduce((total, b) => total + b.stok, 0);
}

function bukuHabis() {
    return buku.filter(b => b.stok === 0);
}

function jumlahDipinjam(bukuId) {
    return peminjaman.filter(
        p => p.bukuId === bukuId && p.status === 'dipinjam'
    ).length;
}

function bukuPalingBanyakDipinjam() {
    return buku.reduce((terbanyak, b) => {
        return jumlahDipinjam(b.id) > jumlahDipinjam(terbanyak.id)
            ? b
            : terbanyak;
    });
}

console.log('=== LAPORAN PERPUSTAKAAN ===');
console.log('Total judul:', totalJudul());
console.log('Total stok:', totalStok());
console.log('Buku habis:', bukuHabis().map(b => b.judul));

const terbanyak = bukuPalingBanyakDipinjam();

console.log(
    'Buku paling banyak dipinjam:',
    terbanyak.judul,
    `(${jumlahDipinjam(terbanyak.id)} kali)`
);

console.log('Daftar buku dan penulis:');

buku.forEach(b => {
    const p = penulis.find(p => p.id === b.penulisId);
    console.log(`${b.judul} - ${p.nama}`);
});