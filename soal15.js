function fetchProductsFromAPI() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const success = Math.random() > 0.2;

            if (!success) {
                return reject(new Error("Gagal mengambil data produk"));
            }

            const jsonData = JSON.stringify([
                {
                    id: 1,
                    name: "Keyboard Mekanikal",
                    category: "Aksesoris",
                    price: 450000,
                    stock: 12
                },
                {
                    id: 2,
                    name: "Mouse Wireless",
                    category: "Aksesoris",
                    price: 150000,
                    stock: 0
                },
                {
                    id: 3,
                    name: "Monitor 24 inch",
                    category: "Elektronik",
                    price: 1800000,
                    stock: 5
                },
                {
                    id: 4,
                    name: "Webcam HD",
                    category: "Elektronik",
                    price: 350000,
                    stock: 8
                }
            ]);

            resolve(jsonData);
        }, 1000);
    });
}


// SOAL 15
let cacheData = null;
let cacheTime = 0;

async function getProductsWithCache() {
    const now = Date.now();

    if (cacheData !== null && now - cacheTime < 5000) {
        console.log("Mengambil data dari cache");
        return cacheData;
    }

    console.log("Mengambil data dari API");

    const jsonData = await fetchProductsFromAPI();
    const data = JSON.parse(jsonData);

    cacheData = data;
    cacheTime = Date.now();

    return data;
}


// Panggil pertama
getProductsWithCache()
    .then((data) => {
        console.log("Data pertama:");
        console.log(data);

        // Panggil kedua dalam waktu kurang dari 5 detik
        return getProductsWithCache();
    })
    .then((data) => {
        console.log("Data kedua:");
        console.log(data);
    })
    .catch((error) => {
        console.log("Error:", error.message);
    });