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

// SOAL 12

function loadProductsFromJSON(jsonString) {
    try {
        const data = JSON.parse(jsonString);

        if (!Array.isArray(data)) {
            throw new Error("Data JSON bukan berupa array");
        }

        return data;

    } catch (error) {
        console.log("Gagal membaca JSON:", error.message);
        return [];
    }
}


const jsonRusak = '[{"id":1,"name":"Keyboard"';

const products = loadProductsFromJSON(jsonRusak);

console.log("Data:", products);