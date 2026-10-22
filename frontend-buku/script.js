
const API = "http://localhost:3000";
const app = document.getElementById("app");

const LINES = [
    "setiap buku, satu cerita.",
    "malam, lampu kota, dan halaman yang belum dibaca.",
    "pelan-pelan saja, ceritanya masih panjang."
];

function getToken() {
    try {
        return localStorage.getItem("token");
    } catch {
        return null;
    }
}

function setToken(token) {
    try {
        if (token) localStorage.setItem("token", token);
        else localStorage.removeItem("token");
    } catch {}
}

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

async function api(path, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    const token = getToken();
    if (token) headers.Authorization = "Bearer " + token;

    const response = await fetch(API + path, {
        ...options,
        headers
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            body.pesan || body.message ||
            "Permintaan gagal (" + response.status + ")"
        );
    }

    if (body && Object.prototype.hasOwnProperty.call(body, "data")) {
        return body;
    }

    return { data: body };
}

function updateNav() {
    const loggedIn = !!getToken();

    document.getElementById("n-login").hidden = loggedIn;
    document.getElementById("n-logout").hidden = !loggedIn;

    const hash = location.hash || "#/books";

    ["books", "authors", "add", "login"].forEach(menu => {
        const element = document.getElementById("n-" + menu);

        if (element) {
            element.classList.toggle("on", hash.startsWith("#/" + menu));
        }
    });
}

document.getElementById("n-logout").onclick = () => {
    setToken(null);
    location.hash = "#/login";
    route();
};

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

// ==================== DAFTAR BUKU ====================

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
        ${books.length ? books.map(book => `
            <a class="book glass" href="#/books/${esc(book.slug)}">
                <b>${esc(book.title)}</b>
                <div class="meta">
                    ${book.year ? esc(book.year) : "Tahun belum diisi"}
                </div>
            </a>
        `).join("") : "<p>Belum ada buku.</p>"}
    `;
}

// ==================== DETAIL BUKU ====================

async function viewBook(slug) {
    app.innerHTML = `<p class="meta">Memuat detail buku...</p>`;

    const result = await api("/books/" + encodeURIComponent(slug));
    const book = result.data;

    app.innerHTML = `
        <a class="back" href="#/books">Kembali ke daftar</a>

        <div class="glass" style="padding:20px 24px">
            <h2>${esc(book.title)}</h2>

            <p class="meta">
                Penulis: ${esc(book.author?.name || "Belum diketahui")}
                | Tahun: ${book.year ? esc(book.year) : "belum diisi"}
            </p>

            <p>${esc(book.description || "Deskripsi belum diisi.")}</p>

            ${getToken() ? `
                <div class="acts">
                    <a class="btn2" href="#/edit/${esc(book.slug)}">Edit buku</a>
                    <button class="btn2 del" id="delBook">Hapus buku</button>
                </div>
            ` : ""}

            <div id="out"></div>
        </div>
    `;

    const button = document.getElementById("delBook");

    if (button) {
        button.onclick = async () => {
            if (!confirm(`Hapus buku "${book.title}"?`)) return;

            try {
                await api("/books/" + book.id, { method: "DELETE" });
                location.hash = "#/books";
            } catch (error) {
                document.getElementById("out").innerHTML =
                    `<div class="msg err">${esc(error.message)}</div>`;
            }
        };
    }
}

// ==================== EDIT BUKU ====================

async function viewEdit(slug) {
    if (!getToken()) {
        app.innerHTML = `
            <h2>Kamu harus masuk terlebih dahulu.</h2>
            <a href="#/login">Masuk</a>
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
        <a class="back" href="#/books/${esc(book.slug)}">Batal</a>

        <div class="glass" style="padding:6px 24px 24px">
            <h2>Edit buku</h2>

            <form id="editBookForm">
                <label for="title">Judul</label>
                <input id="title" required maxlength="200" value="${esc(book.title)}">

                <label for="author">Penulis</label>
                <select id="author" required>
                    ${authors.map(author => `
                        <option value="${esc(author.id)}"
                            ${String(author.id) === String(book.author_id) ? "selected" : ""}>
                            ${esc(author.name)}
                        </option>
                    `).join("")}
                </select>

                <label for="year">Tahun terbit</label>
                <input id="year" type="number" min="1000"
                    max="${new Date().getFullYear()}" value="${book.year ?? ""}">

                <label for="desc">Deskripsi</label>
                <textarea id="desc" rows="4">${esc(book.description)}</textarea>

                <button class="btn" type="submit">Simpan perubahan</button>
            </form>

            <div id="out"></div>
        </div>
    `;

    document.getElementById("editBookForm").onsubmit = async event => {
        event.preventDefault();

        const yearValue = document.getElementById("year").value;

        const body = {
            title: document.getElementById("title").value.trim(),
            author_id: document.getElementById("author").value,
            description: document.getElementById("desc").value,
            year: yearValue ? Number(yearValue) : null
        };

        try {
            const result = await api("/books/" + book.id, {
                method: "PUT",
                body: JSON.stringify(body)
            });

            location.hash = "#/books/" + result.data.slug;
        } catch (error) {
            document.getElementById("out").innerHTML =
                `<div class="msg err">${esc(error.message)}</div>`;
        }
    };
}

// ==================== DAFTAR PENULIS + TAMBAH PENULIS ====================

async function viewAuthors() {
    const header = hero(
        "foto3.jpg",
        "para penulis",
        "di balik tiap halaman, ada seseorang yang begadang."
    );

    app.innerHTML = `
        ${header}

        <div class="author-heading">
            <h2>Penulis</h2>

            ${getToken() ? `
                <button class="btn" id="showAddAuthor">
                    + Tambah Penulis
                </button>
            ` : ""}
        </div>

        <div id="addAuthorArea"></div>

        <div id="authorList">
            <p class="meta">Memuat penulis...</p>
        </div>
    `;

    const addButton = document.getElementById("showAddAuthor");

    if (addButton) {
        addButton.onclick = () => {
            const area = document.getElementById("addAuthorArea");

            if (area.innerHTML.trim()) {
                area.innerHTML = "";
                return;
            }

            area.innerHTML = `
                <div class="glass" style="padding:20px 24px; margin-bottom:20px">
                    <h3>Tambah Penulis Baru</h3>

                    <form id="addAuthorForm">
                        <label for="newAuthorName">Nama penulis</label>

                        <input
                            id="newAuthorName"
                            type="text"
                            maxlength="100"
                            placeholder="Masukkan nama penulis"
                            required
                        >

                        <div class="acts">
                            <button class="btn" type="submit">
                                Simpan Penulis
                            </button>

                            <button class="btn2" type="button" id="cancelAddAuthor">
                                Batal
                            </button>
                        </div>
                    </form>

                    <div id="authorFormMessage"></div>
                </div>
            `;

            document.getElementById("cancelAddAuthor").onclick = () => {
                area.innerHTML = "";
            };

            document.getElementById("addAuthorForm").onsubmit = async event => {
                event.preventDefault();

                const input = document.getElementById("newAuthorName");
                const message = document.getElementById("authorFormMessage");
                const saveButton = event.submitter;
                const name = input.value.trim();

                if (!name) {
                    message.innerHTML = `
                        <div class="msg err">Nama penulis wajib diisi.</div>
                    `;
                    return;
                }

                saveButton.disabled = true;
                saveButton.textContent = "Menyimpan...";

                try {
                    const result = await api("/authors", {
                        method: "POST",
                        body: JSON.stringify({ name })
                    });

                    message.innerHTML = `
                        <div class="msg ok">
                            ${esc(result.pesan || "Penulis berhasil ditambahkan.")}
                        </div>
                    `;

                    await loadAuthorList();

                    input.value = "";
                    input.focus();
                } catch (error) {
                    message.innerHTML = `
                        <div class="msg err">${esc(error.message)}</div>
                    `;
                } finally {
                    saveButton.disabled = false;
                    saveButton.textContent = "Simpan Penulis";
                }
            };
        };
    }

    await loadAuthorList();
}

async function loadAuthorList() {
    const list = document.getElementById("authorList");

    if (!list) return;

    try {
        const result = await api("/authors");
        const authors = result.data || [];

        if (!document.getElementById("authorList")) return;

        list.innerHTML = authors.length
            ? authors.map(author => `
                <a class="book glass" href="#/authors/${esc(author.slug)}">
                    <b>${esc(author.name)}</b>
                    <div class="meta">
                        ${esc(author.total_books ?? 0)} buku
                    </div>
                </a>
            `).join("")
            : "<p>Belum ada data penulis.</p>";
    } catch (error) {
        if (document.getElementById("authorList")) {
            list.innerHTML = `
                <div class="msg err">${esc(error.message)}</div>
            `;
        }
    }
}

// ==================== DETAIL PENULIS ====================

async function viewAuthor(slug) {
    const result = await api("/authors/" + encodeURIComponent(slug));
    const author = result.data;

    app.innerHTML = `
        <a class="back" href="#/authors">Kembali ke penulis</a>

        <div class="glass" style="padding:20px 24px">
            <h2>${esc(author.name)}</h2>

            ${getToken() ? `
                <div class="acts">
                    <a class="btn2" href="#/edit-author/${esc(author.id)}">Edit penulis</a>
                    <button class="btn2 del" id="deleteAuthor">Hapus penulis</button>
                </div>
            ` : ""}

            <div id="out"></div>

            <h3>Buku karya penulis</h3>

            ${author.books?.length ? author.books.map(book => `
                <div class="book glass">
                    <b>${esc(book.title)}</b>
                </div>
            `).join("") : "<p>Penulis ini belum punya buku.</p>"}
        </div>
    `;

    const button = document.getElementById("deleteAuthor");

    if (button) {
        button.onclick = async () => {
            if (!confirm(`Hapus penulis "${author.name}"?`)) return;

            try {
                await api("/authors/" + author.id, { method: "DELETE" });
                location.hash = "#/authors";
            } catch (error) {
                document.getElementById("out").innerHTML =
                    `<div class="msg err">${esc(error.message)}</div>`;
            }
        };
    }
}

// ==================== EDIT PENULIS ====================

async function viewEditAuthor(id) {
    if (!getToken()) {
        app.innerHTML = `
            <h2>Kamu harus masuk terlebih dahulu.</h2>
            <a href="#/login">Masuk</a>
        `;
        return;
    }

    const result = await api("/authors");
    const authors = result.data || [];
    const author = authors.find(item => String(item.id) === String(id));

    if (!author) {
        app.innerHTML = `<p>Penulis tidak ditemukan.</p>`;
        return;
    }

    app.innerHTML = `
        <a class="back" href="#/authors/${esc(author.slug)}">Batal</a>

        <div class="glass" style="padding:20px 24px">
            <h2>Edit penulis</h2>

            <form id="editAuthorForm">
                <label for="authorName">Nama penulis</label>
                <input id="authorName" required maxlength="100" value="${esc(author.name)}">

                <button class="btn" type="submit">Simpan perubahan</button>
            </form>

            <div id="out"></div>
        </div>
    `;

    document.getElementById("editAuthorForm").onsubmit = async event => {
        event.preventDefault();

        try {
            const response = await api("/authors/" + author.id, {
                method: "PUT",
                body: JSON.stringify({
                    name: document.getElementById("authorName").value.trim()
                })
            });

            location.hash = "#/authors/" + response.data.slug;
        } catch (error) {
            document.getElementById("out").innerHTML =
                `<div class="msg err">${esc(error.message)}</div>`;
        }
    };
}

// ==================== LOGIN ====================

function viewLogin() {
    app.innerHTML = `
        <div class="login">
            <div class="stack">
                <div class="pol"><img src="foto1.jpg" alt=""><span>jalan pulang</span></div>
                <div class="pol"><img src="foto2.jpg" alt=""><span>lampu kota</span></div>
                <div class="pol"><img src="foto3.jpg" alt=""><span>sebelum tutup</span></div>
            </div>

            <div>
                <p class="tag" id="tag"> </p>

                <div class="glass card">
                    <h2>Masuk</h2>

                    <form id="loginForm">
                        <label for="email">Email</label>
                        <input id="email" type="email" required>

                        <label for="pw">Password</label>
                        <input id="pw" type="password" required>

                        <button class="btn" type="submit">Masuk</button>
                    </form>

                    <div id="out"></div>
                </div>
            </div>
        </div>
    `;

    typeLines(document.getElementById("tag"));

    document.getElementById("loginForm").onsubmit = async event => {
        event.preventDefault();

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
            document.getElementById("out").innerHTML =
                `<div class="msg err">${esc(error.message)}</div>`;
        }
    };
}

// ==================== TAMBAH BUKU ====================

async function viewAdd() {
    if (!getToken()) {
        app.innerHTML = `
            <h2>Kamu harus masuk terlebih dahulu.</h2>
            <a href="#/login">Masuk</a>
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

        <div class="glass" style="padding:6px 24px 24px">
            <h2>Tambah buku</h2>

            <form id="addBookForm">
                <label for="title">Judul</label>
                <input id="title" required maxlength="200">

                <label for="author">Penulis</label>
                <select id="author" required>
                    ${authors.map(author => `
                        <option value="${esc(author.id)}">${esc(author.name)}</option>
                    `).join("")}
                </select>

                <label for="year">Tahun terbit</label>
                <input id="year" type="number" min="1000"
                    max="${new Date().getFullYear()}">

                <label for="desc">Deskripsi</label>
                <textarea id="desc" rows="4"></textarea>

                <button class="btn" type="submit">Simpan buku</button>
            </form>

            <div id="out"></div>
        </div>
    `;

    document.getElementById("addBookForm").onsubmit = async event => {
        event.preventDefault();

        const yearValue = document.getElementById("year").value;

        const body = {
            title: document.getElementById("title").value.trim(),
            author_id: document.getElementById("author").value,
            description: document.getElementById("desc").value,
            year: yearValue ? Number(yearValue) : null
        };

        try {
            const result = await api("/books", {
                method: "POST",
                body: JSON.stringify(body)
            });

            document.getElementById("out").innerHTML = `
                <div class="msg ok">
                    Buku berhasil ditambahkan.
                    <a href="#/books/${esc(result.data.slug)}">Lihat detail</a>
                </div>
            `;

            event.target.reset();
        } catch (error) {
            document.getElementById("out").innerHTML =
                `<div class="msg err">${esc(error.message)}</div>`;
        }
    };
}

// ==================== ROUTER ====================

async function route() {
    updateNav();

    const parts = (location.hash || "#/books").slice(2).split("/");

    try {
        if (parts[0] === "books" && parts[1]) {
            await viewBook(parts[1]);
        } else if (parts[0] === "authors" && parts[1]) {
            await viewAuthor(parts[1]);
        } else if (parts[0] === "authors") {
            await viewAuthors();
        } else if (parts[0] === "edit" && parts[1]) {
            await viewEdit(parts[1]);
        } else if (parts[0] === "edit-author" && parts[1]) {
            await viewEditAuthor(parts[1]);
        } else if (parts[0] === "add") {
            await viewAdd();
        } else if (parts[0] === "login") {
            viewLogin();
        } else {
            await viewBooks();
        }
    } catch (error) {
        app.innerHTML = `
            <div class="msg err">
                ${esc(error.message)}.
                Pastikan backend berjalan di ${API}.
            </div>
        `;
    }
}

window.addEventListener("hashchange", route);
route();
