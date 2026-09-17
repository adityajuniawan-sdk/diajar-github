function fetchProductsFromAPI() {
 return new Promise((resolve, reject) => {
 setTimeout(() => {
 const success = Math.random() > 0.2; // ~20% kemungkinan gagal
 if (!success) return reject(new Error('Gagal mengambil data produk'));
 const jsonData = JSON.stringify([
 { id: 1, name: "Keyboard Mekanikal", category: "Aksesoris", price: 
450000, stock: 12 },
 { id: 2, name: "Mouse Wireless", category: "Aksesoris", price: 
150000, stock: 0 },
 { id: 3, name: "Monitor 24 inch", category: "Elektronik", price: 
1800000, stock: 5 },
 { id: 4, name: "Webcam HD", category: "Elektronik", price: 
350000, stock: 8 }
 ]);
 resolve(jsonData);
 }, 1000);
 });
}
// SOAL 2

fetchProductsFromAPI()
    .then((data) => {
        const products = JSON.parse(data);

        console.log("Hasil setelah JSON.parse():");
        console.log(products);
    })
    .catch((error) => {
        console.log("Error:", error.message);
    });