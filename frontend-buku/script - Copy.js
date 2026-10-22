
const API = "http://localhost:3000";

const app = document.getElementById("app");

const LINES = [
    "setiap buku, satu cerita.",
    "malam, lampu kota, dan halaman yang belum dibaca.",
    "pelan-pelan saja, ceritanya masih panjang."
];


// ========================================
// TOKEN DAN HELPER
// ========================================

function getToken() {
    try {
        return localStorage.getItem("token");
    } catch (error) {
        return null;
    }
}


function setToken(token) {
    try {
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    } catch (error) {
        // Penyimpanan browser tidak tersedia.
    }
}


function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// ========================================
// KONEKSI API
// ========================================

async function api(path, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    const token = getToken();

    if (token) {
        headers.Authorization = "Bearer " + token;
    }

    const response = await fetch(API + path, {
        ...options,
        headers
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            body.pesan ||
            body.message ||
            "Permintaan gagal (" + response.status + ")"
        );
    }

    return body;
}


// ========================================
// NAVIGASI
// ========================================

function updateNav() {
    const loggedIn = !!getToken();

    document.getElementById("n-login").hidden = loggedIn;
    document.getElementById("n-logout").hidden = !loggedIn;

    const hash = location.hash || "#/books";

    ["books", "authors", "add", "login"].forEach(menu => {
        document
            .getElementById("n-" + menu)
            .classList.toggle("on", hash.startsWith("#/" + menu));
    });
}


document.getElementById("n-logout").onclick = () => {
    setToken(null);
    location.hash = "#/login";
    route();
};


// ========================================
// KOMPONEN HERO
// ========================================

function hero(image, caption, text) {
    return `
        <div class="hero">
            <div class="pol">
                <img src="${image}" alt="">
                <span>${caption}</span>
            </div>

            <p>${text}</p>
        </div>
    `;
}


// ========================================
// ANIMASI TEKS LOGIN
// ========================================

let typer;

function typeLines(element) {
    clearInterval(typer);

    let lineIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let wait = 0;

    typer = setInterval(() => {
        if (!document.body.contains(element)) {
            clearInterval(typer);
            return;
        }

        if (wait > 0) {
            wait--;
            return;
        }

        const line = LINES[lineIndex];

        if (!deleting) {
            charIndex++;

            if (charIndex >= line.length) {
                deleting = true;
                wait = 22;
            }
        } else {
            charIndex -= 2;

            if (charIndex <= 0) {
                charIndex = 0;
                deleting = false;
                lineIndex = (lineIndex + 1) % LINES.length;
                wait = 4;
            }
        }

        element.firstChild.nodeValue = line.slice(0, charIndex);
    }, 55);
}


// ========================================
// DAFTAR BUKU
// ========================================

async function viewBooks() {
    const header = hero(
        "foto2.jpg",
        "halaman satu",
        "pilih satu cerita, lalu biarkan malam menemanimu."
    );

    app.innerHTML = `
        ${header}

        <h2>Daftar buku</h2>

        <p class="meta">Memuat buku...</p>
    `;

    const result = await api("/books");
    const books = result.data || [];

    app.innerHTML = `
        ${header}

        <h2>Daftar buku</h2>

        ${
            books.length
                ? books.map(book => `
                    <a
                        class="book glass"
                        href="#/books/${esc(book.slug)}"
                    >
                        <b>${esc(book.title)}</b>

                        <div class="meta">
                            ${
                                book.year
                                    ? esc(book.year)
                                    : "Tahun belum diisi"
                            }
                        </div>
                    </a>
                `).join("")
                : "<p>Belum ada buku. Tambah buku pertama lewat menu Tambah buku.</p>"
        }
    `;
}


// ========================================
// DETAIL BUKU
// ========================================

async function viewBook(slug) {
    app.innerHTML = `
        <p class="meta">Memuat detail buku...</p>
    `;

    const result = await api(
        "/books/" + encodeURIComponent(slug)
    );

    const book = result.data;

    const actions = getToken()
        ? `
            <div class="acts">
                <a
                    class="btn2"
                    href="#/edit/${esc(book.slug)}"
                >
                    Edit buku
                </a>

                <button class="btn2 del" id="del">
                    Hapus buku
                </button>
            </div>
        `
        : "";

    app.innerHTML = `
        <a class="back" href="#/books">
            Kembali ke daftar
        </a>

        <div class="glass" style="padding: 20px 24px">
            <h2>${esc(book.title)}</h2>

            <p class="meta">
                Penulis: ${esc(book.author?.name || "Belum diketahui")}
                |
                Tahun: ${
                    book.year
                        ? esc(book.year)
                        : "belum diisi"
                }
            </p>

            <p>
                ${
                    book.description
                        ? esc(book.description)
                        : "Deskripsi belum diisi."
                }
            </p>

            ${actions}

            <div id="out"></div>
        </div>
    `;

    const deleteButton = document.getElementById("del");

    if (deleteButton) {
        deleteButton.onclick = async () => {
            const confirmed = confirm(
                `Hapus buku "${book.title}"? Ini nggak bisa dibatalkan.`
            );

            if (!confirmed) {
                return;
            }

            try {
                await api("/books/" + book.id, {
                    method: "DELETE"
                });

                location.hash = "#/books";
            } catch (error) {
                document.getElementById("out").innerHTML = `
                    <div class="msg err">
                        ${esc(error.message)}
                    </div>
                `;
            }
        };
    }
}


// ========================================
// EDIT BUKU
// ========================================

async function viewEdit(slug) {
    if (!getToken()) {
        app.innerHTML = `
            <h2>Edit buku</h2>

            <div class="msg err">
                Kamu harus masuk dulu.
                <a href="#/login" style="color: var(--amber)">
                    Masuk di sini
                </a>.
            </div>
        `;

        return;
    }

    const [bookResult, authorResult] = await Promise.all([
        api("/books/" + encodeURIComponent(slug)),
        api("/authors")
    ]);

    const book = bookResult.data;
    const authors = authorResult.data || [];

    app.innerHTML = `
        <a class="back" href="#/books/${esc(book.slug)}">
            Batal
        </a>

        <div class="glass" style="padding: 6px 24px 24px">
            <h2 style="margin-top: 14px">
                Edit buku
            </h2>

            <form id="f">
                <label for="title">Judul</label>

                <input
                    id="title"
                    required
                    maxlength="200"
                    value="${esc(book.title)}"
                >

                <label for="author">Penulis</label>

                <select id="author">
                    ${authors.map(author => `
                        <option
                            value="${esc(author.id)}"
                            ${
                                String(author.id) === String(book.author_id)
                                    ? "selected"
                                    : ""
                            }
                        >
                            ${esc(author.name)}
                        </option>
                    `).join("")}
                </select>

                <label for="year">Tahun terbit</label>

                <input
                    id="year"
                    type="number"
                    min="1000"
                    max="${new Date().getFullYear()}"
                    value="${book.year ?? ""}"
                >

                <label for="desc">Deskripsi</label>

                <textarea id="desc" rows="4">${esc(book.description)}</textarea>

                <button class="btn" type="submit">
                    Simpan perubahan
                </button>
            </form>

            <div id="out"></div>
        </div>
    `;

    document.getElementById("f").onsubmit = async event => {
        event.preventDefault();

        const output = document.getElementById("out");

        const body = {
            title: document.getElementById("title").value,
            author_id: document.getElementById("author").value,
            description: document.getElementById("desc").value
        };

        const year = document.getElementById("year").value;

        if (year) {
            body.year = Number(year);
        }

        try {
            const result = await api("/books/" + book.id, {
                method: "PUT",
                body: JSON.stringify(body)
            });

            location.hash = "#/books/" + result.data.slug;
        } catch (error) {
            output.innerHTML = `
                <div class="msg err">
                    ${esc(error.message)}
                </div>
            `;
        }
    };
}


// ========================================
// DAFTAR PENULIS
// ========================================

async function viewAuthors() {
    const header = hero(
        "foto3.jpg",
        "para penulis",
        "di balik tiap halaman, ada seseorang yang begadang."
    );

    app.innerHTML = `
        ${header}

        <h2>Penulis</h2>

        <p class="meta">Memuat penulis...</p>
    `;

    const result = await api("/authors");
    const authors = result.data || [];

    app.innerHTML = `
        ${header}

        <h2>Penulis</h2>

        ${
            authors.length
                ? authors.map(author => `
                    <a
                        class="book glass"
                        href="#/authors/${esc(author.slug)}"
                    >
                        <b>${esc(author.name)}</b>
                    </a>
                `).join("")
                : "<p>Belum ada data penulis.</p>"
        }
    `;
}


// ========================================
// DETAIL PENULIS
// ========================================

async function viewAuthor(slug) {
    const result = await api(
        "/authors/" + encodeURIComponent(slug)
    );

    const author = result.data;

    app.innerHTML = `
        <a class="back" href="#/authors">
            Kembali ke penulis
        </a>

        <h2>${esc(author.name)}</h2>

        ${
            author.books?.length
                ? author.books.map(book => `
                    <a
                        class="book glass"
                        href="#/books/${esc(book.slug)}"
                    >
                        <b>${esc(book.title)}</b>
                    </a>
                `).join("")
                : "<p>Penulis ini belum punya buku.</p>"
        }
    `;
}


// ========================================
// LOGIN
// ========================================

function viewLogin() {
    app.innerHTML = `
        <div class="login">
            <div class="stack">
                <div class="pol">
                    <img src="foto1.jpg" alt="">
                    <span>jalan pulang</span>
                </div>

                <div class="pol">
                    <img src="foto2.jpg" alt="">
                    <span>lampu kota</span>
                </div>

                <div class="pol">
                    <img src="foto3.jpg" alt="">
                    <span>sebelum tutup</span>
                </div>
            </div>

            <div>
                <p class="tag" id="tag"> </p>

                <div class="glass card">
                    <h2>Masuk</h2>

                    <form id="f">
                        <label for="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            required
                        >

                        <label for="pw">Password</label>
                        <input
                            id="pw"
                            type="password"
                            required
                        >

                        <button class="btn" type="submit">
                            Masuk
                        </button>
                    </form>

                    <div id="out"></div>
                </div>
            </div>
        </div>
    `;

    typeLines(document.getElementById("tag"));

    document.getElementById("f").onsubmit = async event => {
        event.preventDefault();

        const output = document.getElementById("out");

        try {
            const result = await api("/login", {
                method: "POST",

                body: JSON.stringify({
                    email: document.getElementById("email").value,
                    password: document.getElementById("pw").value
                })
            });

            setToken(result.data.token);

            location.hash = "#/books";
            updateNav();
        } catch (error) {
            output.innerHTML = `
                <div class="msg err">
                    ${esc(error.message)}
                </div>
            `;
        }
    };
}


// ========================================
// TAMBAH BUKU
// ========================================

async function viewAdd() {
    if (!getToken()) {
        app.innerHTML = `
            <h2>Tambah buku</h2>

            <div class="msg err">
                Kamu harus masuk dulu.
                <a href="#/login" style="color: var(--amber)">
                    Masuk di sini
                </a>.
            </div>
        `;

        return;
    }

    const result = await api("/authors");
    const authors = result.data || [];

    const header = hero(
        "foto1.jpg",
        "catatan baru",
        "tulis satu judul lagi untuk rak malam ini."
    );

    app.innerHTML = `
        ${header}

        <div class="glass" style="padding: 6px 24px 24px">
            <h2 style="margin-top: 14px">
                Tambah buku
            </h2>

            <form id="f">
                <label for="title">Judul</label>

                <input
                    id="title"
                    required
                    maxlength="200"
                >

                <label for="author">Penulis</label>

                <select id="author" required>
                    ${
                        authors.map(author => `
                            <option value="${esc(author.id)}">
                                ${esc(author.name)}
                            </option>
                        `).join("")
                    }
                </select>

                <label for="year">Tahun terbit</label>

                <input
                    id="year"
                    type="number"
                    min="1000"
                    max="${new Date().getFullYear()}"
                >

                <label for="desc">Deskripsi</label>

                <textarea id="desc" rows="4"></textarea>

                <button class="btn" type="submit">
                    Simpan buku
                </button>
            </form>

            <div id="out"></div>
        </div>
    `;

    document.getElementById("f").onsubmit = async event => {
        event.preventDefault();

        const output = document.getElementById("out");

        const body = {
            title: document.getElementById("title").value,
            author_id: document.getElementById("author").value,
            description: document.getElementById("desc").value
        };

        const year = document.getElementById("year").value;

        if (year) {
            body.year = Number(year);
        }

        try {
            const result = await api("/books", {
                method: "POST",
                body: JSON.stringify(body)
            });

            output.innerHTML = `
                <div class="msg ok">
                    Buku "${esc(result.data.title)}" tersimpan.

                    <a
                        href="#/books/${esc(result.data.slug)}"
                        style="color: var(--amber)"
                    >
                        Lihat detail
                    </a>
                </div>
            `;

            event.target.reset();
        } catch (error) {
            output.innerHTML = `
                <div class="msg err">
                    ${esc(error.message)}
                </div>
            `;
        }
    };
}


// ========================================
// ROUTER
// ========================================

async function route() {
    updateNav();

    const hash = (location.hash || "#/books")
        .slice(2)
        .split("/");

    try {
        if (hash[0] === "books" && hash[1]) {
            await viewBook(hash[1]);
        } else if (hash[0] === "authors" && hash[1]) {
            await viewAuthor(hash[1]);
        } else if (hash[0] === "authors") {
            await viewAuthors();
        } else if (hash[0] === "edit" && hash[1]) {
            await viewEdit(hash[1]);
        } else if (hash[0] === "add") {
            await viewAdd();
        } else if (hash[0] === "login") {
            viewLogin();
        } else {
            await viewBooks();
        }
    } catch (error) {
        app.innerHTML = `
            <div class="msg err">
                ${esc(error.message)}.

                Pastikan server backend berjalan di
                ${API}.
            </div>
        `;
    }
}


// ========================================
// JALANKAN APLIKASI
// ========================================

window.addEventListener("hashchange", route);

route();
