const penulis = [
    { id: 'P01', nama: 'Andrea Hirata', negara: 'Indonesia' },
    { id: 'P02', nama: 'Pramoedya Ananta Toer', negara: 'Indonesia' },
    { id: 'P03', nama: 'J.K. Rowling', negara: 'Inggris' }
];

const buku = [
    {
        id: 'B01',
        judul: 'Laskar Pelangi',
        penulisId: 'P01',
        tahun: 2005,
        stok: 4,
        kategori: 'pendidikan'
    },
    {
        id: 'B02',
        judul: 'Bumi Manusia',
        penulisId: 'P02',
        tahun: 1980,
        stok: 2,
        kategori: 'sejarah'
    },
    {
        id: 'B03',
        judul: 'Harry Potter',
        penulisId: 'P03',
        tahun: 1997,
        stok: 6,
        kategori: 'fantasi'
    }
];

const peminjaman = [
    {
        id: 'L01',
        bukuId: 'B01',
        namaPeminjam: 'Ayu',
        status: 'dipinjam'
    },
    {
        id: 'L02',
        bukuId: 'B02',
        namaPeminjam: 'Budi',
        status: 'dipinjam'
    },
    {
        id: 'L03',
        bukuId: 'B03',
        namaPeminjam: 'Citra',
        status: 'dikembalikan'
    }
];

export { penulis, buku, peminjaman};