const http = require('http');
const { penulis, buku, peminjaman } = require('./data');

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });

    res.end(JSON.stringify({
        penulis,
        buku,
        peminjaman
    }, null, 2));
});

server.listen(3001, () => {
    console.log('Server jalan di http://localhost:3001');
});