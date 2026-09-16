const { buku, peminjaman } = require('./data');

peminjaman.forEach(p => {
    const b = buku.find(b => b.id === p.bukuId);

    console.log(
        `${p.namaPeminjam} meminjam ${b.judul} - ${p.status}`
    );
});