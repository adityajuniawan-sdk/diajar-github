
"use strict";

// ========================================
// KONFIGURASI API
// ========================================

// Untuk jaringan lokal: frontend dan backend menggunakan hostname
// yang sama, sedangkan backend berjalan di port 3000.
//
// Jika backend di-host terpisah, ganti nilai ini dengan URL backend
// yang sebenarnya, misalnya: "https://api-domain-kamu.example".
const API = `${window.location.protocol}//${window.location.hostname}:3000`;

const app = document.getElementById("app");

const LINES = [
    "setiap buku, satu cerita.",
    "malam, lampu kota, dan halaman yang belum dibaca.",
    "pelan-pelan saja, ceritanya masih panjang."
];

let typer;
let currentRoute = "";
let routeVersion = 0;

// ========================================
// TOKEN DAN HELPER
// ========================================

function getToken() {
    try {
        return localStorage.getItem("token");
    } catch {
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
    } catch {}
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

function normalizeList(result) {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.data?.data)) return result.data.data;
    return [];
}

function normalizeRecord(result) {
    if (!result) return null;

    if (result.data?.data && !Array.isArray(result.data.data)) {
        return result.data.data;
    }

    return result.data ?? result;
}

function showMessage(target, message, type = "err") {
    if (!target) return;

    target.innerHTML = `
        <div class="msg ${type}" role="status">
            ${esc(message)}
        </div>
    `;
}

function yearLabel(book) {
    return book?.year
        ? esc(book.year)
        : "Tahun belum diisi";
}

// ========================================
// KONEKSI API
// ========================================

async function api(path, options = {}) {
    const headers = {
        ...(options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
        ...options.headers
    };

    const token = getToken();

    if (token) {
        headers.Authorization = "Bearer " + token;
    }

    let response;

    try {
        response = await fetch(API + path, {
            ...options,
            headers
        });
    } catch {
        throw new Error(
            `Tidak dapat terhubung ke backend (${API}). ` +
            "Periksa alamat API, server, CORS, dan koneksi jaringan."
        );
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (
            response.status === 401 &&
            getToken() &&
            path !== "/login" &&
            path !== "/register"
        ) {
            setToken(null);
        }

        throw new Error(
            body.pesan ||
            body.message ||
            body.error ||
            "Permintaan gagal (" + response.status + ")"
        );
    }

    if (Array.isArray(body)) {
        return { data: body };
    }

    return body;
}

// ========================================
// DATA BUKU DAN RELASI PENULIS
// ========================================

async function loadBooksWithAuthors() {
    const [bookResult, authorResult] = await Promise.all([
        api("/books"),
        api("/authors")
    ]);

    const books = normalizeList(bookResult);
    const authors = normalizeList(authorResult);

    return books.map(book => {
        const authorId =
            book.author_id ??
            book.authorId ??
            book.authorId_fk ??
            book.author?.id ??
            book.author?.author_id;

        const author = book.author?.name
            ? book.author
            : authors.find(item =>
                authorId != null &&
                String(item.id) === String(authorId)
            );

        return {
            ...book,
            author: author || null
        };
    });
}

function getAuthorName(book) {
    return book?.author?.name ||
        book?.author_name ||
        book?.authorName ||
        "Belum diketahui";
}

// ========================================
// NAVIGASI
// ========================================

function updateNav() {
    const loggedIn = !!getToken();
    const hash = location.hash || "#/dashboard";

    const visibility = {
        "n-dashboard": true,
        "n-profile": true,
        "n-login": !loggedIn,
        "n-logout": loggedIn,
        "n-books": loggedIn,
        "n-authors": loggedIn,
        "n-add": loggedIn
    };

    Object.entries(visibility).forEach(([id, visible]) => {
        const element = document.getElementById(id);

        if (element) {
            element.hidden = !visible;
        }
    });

    [
        "dashboard",
        "books",
        "authors",
        "add",
        "profile",
        "login"
    ].forEach(menu => {
        const element = document.getElementById("n-" + menu);

        if (element) {
            element.classList.toggle(
                "active",
                hash === "#/" + menu ||
                hash.startsWith("#/" + menu + "/")
            );
        }
    });
}

// ========================================
// LOGOUT
// ========================================

const logoutButton = document.getElementById("n-logout");

if (logoutButton) {
    logoutButton.onclick = () => {
        setToken(null);
        location.hash = "#/dashboard";
        route();
    };
}

// ========================================
// TOMBOL KEMBALI
// ========================================

function backButton(fallback = "#/dashboard", label = "Kembali") {
    return `
        <div class="back-wrap">
            <button
                type="button"
                class="back-button"
                onclick="goBack('${esc(fallback)}')"
            >
                <span aria-hidden="true">←</span>
                ${esc(label)}
            </button>
        </div>
    `;
}

function goBack(fallback = "#/dashboard") {
    location.hash = fallback;
}

// ========================================
// HERO
// ========================================

function hero(image, caption, text) {
    return `
        <div class="hero">
            <div class="pol">
                <img src="${esc(image)}" alt="">
                <span>${esc(caption)}</span>
            </div>
            <p>${esc(text)}</p>
        </div>
    `;
}

// ========================================
// ANIMASI TEKS
// ========================================

function typeLines(element) {
    clearInterval(typer);

    if (!element) return;

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
                charIndex = line.length;
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

        element.textContent = line.slice(0, charIndex);
    }, 55);
}

// ========================================
// DASHBOARD
// ========================================

async function viewDashboard() {
    if (!getToken()) {
        app.innerHTML = `
            <section class="welcome-page page-enter">
                <div class="dashboard-welcome glass">
                    <p class="meta welcome-label">PERSONAL BOOK COLLECTION</p>
                    <div class="welcome-monogram">RB</div>
                    <h1 class="welcome-title">Selamat datang</h1>

                    <p class="welcome-copy">
                        Sebuah ruang untuk menyimpan cerita,
                        mengenal pemikiran, dan menemukan halaman
                        baru dalam setiap perjalanan.
                    </p>

                    <p class="welcome-typing" id="welcome-typing">
                        setiap buku, satu cerita.
                    </p>

                    <div class="acts">
                        <a class="btn" href="#/login">Masuk ke Rak Buku</a>
                        <a class="btn2" href="#/profile">Kenali Pemilik</a>
                    </div>
                </div>

                <p class="meta welcome-footer">
                    OPEN A BOOK · DISCOVER A WORLD
                </p>
            </section>
        `;

        typeLines(document.getElementById("welcome-typing"));
        return;
    }

    app.innerHTML = `
        <section class="dashboard page-enter">
            <div class="dashboard-welcome glass">
                <p class="meta">YOUR PERSONAL LIBRARY</p>
                <h2>Selamat datang kembali.</h2>
                <p>Rak bukumu, kumpulan cerita dan pengetahuan yang terus bertambah.</p>

                <div class="acts">
                    <a class="btn" href="#/add">Tambah buku</a>
                    <a class="btn2" href="#/authors">Lihat penulis</a>
                </div>
            </div>

            <div class="dashboard-stats">
                <div class="glass stat-card">
                    <p class="meta">TOTAL BUKU</p>
                    <h2 id="stat-books">—</h2>
                    <a href="#/books">Lihat koleksi →</a>
                </div>

                <div class="glass stat-card">
                    <p class="meta">TOTAL PENULIS</p>
                    <h2 id="stat-authors">—</h2>
                    <a href="#/authors">Lihat penulis →</a>
                </div>
            </div>

            <div class="glass dashboard-collection">
                <div class="section-heading">
                    <h2>Koleksi terbaru</h2>
                    <a class="btn2" href="#/books">Semua buku</a>
                </div>

                <div id="latest-books">
                    <p class="meta">Memuat koleksi...</p>
                </div>
            </div>
        </section>
    `;

    const version = routeVersion;

    const [books, authorResult] = await Promise.all([
        loadBooksWithAuthors(),
        api("/authors")
    ]);

    if (version !== routeVersion) return;

    const authors = normalizeList(authorResult);
    const bookCount = document.getElementById("stat-books");
    const authorCount = document.getElementById("stat-authors");
    const latest = document.getElementById("latest-books");

    if (!bookCount || !authorCount || !latest) return;

    bookCount.textContent = books.length;
    authorCount.textContent = authors.length;

    latest.innerHTML = books.length
        ? books.slice(0, 4).map(book => `
            <a class="book" href="#/books/${encodeURIComponent(book.slug)}">
                <b>${esc(book.title)}</b>
                <div class="meta">
                    Penulis: ${esc(getAuthorName(book))}
                    ${book.year ? " · " + esc(book.year) : ""}
                </div>
            </a>
        `).join("")
        : `<p class="meta">Belum ada buku di koleksi ini.</p>`;
}

// ========================================
// PROFIL
// ========================================

function viewProfile() {
    app.innerHTML = `
        <section class="profile-page page-enter">
            ${backButton("#/dashboard")}

            <div class="glass profile-card">
                <p class="meta">BEHIND THE COLLECTION</p>

                <img class="profile-photo" src="foto1.jpg" alt="Foto profil">

                <h2>Aditya Juniawan Sidik</h2>

                <p>
                    Mengabadikan cerita, ide, dan perjalanan
                    melalui karya dan tulisan.
                </p>

                <div class="acts">
                    <a class="btn2"
                       href="https://www.instagram.com/jnwnsidik18_/"
                       target="_blank" rel="noopener noreferrer">
                        Instagram ↗
                    </a>

                    <a class="btn" href="#/dashboard">Dashboard</a>
                </div>
            </div>
        </section>
    `;
}

// ========================================
// LOGIN DAN REGISTER
// ========================================

function viewLogin() {
    let mode = "login";

    app.innerHTML = `
        <section class="page-enter">
            ${backButton("#/dashboard")}

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
                    <p class="tag" id="tag"></p>

                    <div class="glass card">
                        <h2 id="auth-title">Masuk</h2>

                        <p id="auth-description" class="meta">
                            Masuk ke akun Rak Buku kamu.
                        </p>

                        <form id="auth-form">
                            <div id="name-wrap" hidden>
                                <label for="auth-name">Nama lengkap</label>
                                <input
                                    id="auth-name"
                                    type="text"
                                    autocomplete="name"
                                    maxlength="100"
                                    placeholder="Nama kamu"
                                >
                            </div>

                            <label for="auth-email">Email</label>
                            <input
                                id="auth-email"
                                type="email"
                                autocomplete="username"
                                maxlength="254"
                                placeholder="nama@email.com"
                                required
                            >

                            <label for="auth-password">Password</label>

                            <div class="password-wrap">
                                <input
                                    id="auth-password"
                                    type="password"
                                    autocomplete="current-password"
                                    minlength="8"
                                    placeholder="Minimal 8 karakter"
                                    required
                                >

                                <button
                                    type="button"
                                    class="toggle-password"
                                    data-password-target="auth-password"
                                    aria-label="Lihat password"
                                    aria-pressed="false"
                                >👁️</button>
                            </div>

                            <div id="confirm-wrap" hidden>
                                <label for="auth-confirm">
                                    Konfirmasi password
                                </label>

                                <div class="password-wrap">
                                    <input
                                        id="auth-confirm"
                                        type="password"
                                        autocomplete="new-password"
                                        minlength="8"
                                        placeholder="Ulangi password"
                                    >

                                    <button
                                        type="button"
                                        class="toggle-password"
                                        data-password-target="auth-confirm"
                                        aria-label="Lihat password"
                                        aria-pressed="false"
                                    >👁️</button>
                                </div>
                            </div>

                            <button
                                class="btn"
                                id="auth-submit"
                                type="submit"
                            >
                                Masuk
                            </button>
                        </form>

                        <p class="meta" style="margin-top: 18px;">
                            <span id="auth-switch-text">
                                Belum punya akun?
                            </span>

                            <button
                                type="button"
                                id="auth-switch"
                                class="btn2"
                            >
                                Daftar sekarang
                            </button>
                        </p>

                        <div id="out" aria-live="polite"></div>
                    </div>
                </div>
            </div>
        </section>
    `;

    typeLines(document.getElementById("tag"));

    const form = document.getElementById("auth-form");
    const nameWrap = document.getElementById("name-wrap");
    const nameInput = document.getElementById("auth-name");
    const emailInput = document.getElementById("auth-email");
    const passwordInput = document.getElementById("auth-password");
    const confirmWrap = document.getElementById("confirm-wrap");
    const confirmInput = document.getElementById("auth-confirm");
    const submitButton = document.getElementById("auth-submit");
    const title = document.getElementById("auth-title");
    const description = document.getElementById("auth-description");
    const switchText = document.getElementById("auth-switch-text");
    const switchButton = document.getElementById("auth-switch");
    const output = document.getElementById("out");

    // TOMBOL MATA PASSWORD
    document.querySelectorAll(".toggle-password").forEach(button => {
        button.onclick = () => {
            const input = document.getElementById(
                button.dataset.passwordTarget
            );

            if (!input) return;

            const tampil = input.type === "password";

            input.type = tampil ? "text" : "password";
            button.textContent = tampil ? "🙈" : "👁️";

            button.setAttribute(
                "aria-label",
                tampil ? "Sembunyikan password" : "Lihat password"
            );

            button.setAttribute("aria-pressed", String(tampil));
        };
    });

    function renderMode() {
        const registering = mode === "register";

        title.textContent = registering ? "Buat Akun" : "Masuk";

        description.textContent = registering
            ? "Daftar untuk mulai menggunakan Rak Buku."
            : "Masuk ke akun Rak Buku kamu.";

        nameWrap.hidden = !registering;
        confirmWrap.hidden = !registering;

        nameInput.required = registering;
        confirmInput.required = registering;

        passwordInput.autocomplete = registering
            ? "new-password"
            : "current-password";

        document.querySelectorAll(".toggle-password").forEach(button => {
            const input = document.getElementById(
                button.dataset.passwordTarget
            );

            if (input) input.type = "password";

            button.textContent = "👁️";
            button.setAttribute("aria-label", "Lihat password");
            button.setAttribute("aria-pressed", "false");
        });

        submitButton.textContent = registering ? "Daftar Akun" : "Masuk";

        switchText.textContent = registering
            ? "Sudah punya akun?"
            : "Belum punya akun?";

        switchButton.textContent = registering
            ? "Masuk di sini"
            : "Daftar sekarang";

        output.replaceChildren();
    }

    switchButton.onclick = () => {
        mode = mode === "login" ? "register" : "login";
        renderMode();
    };

    form.onsubmit = async event => {
        event.preventDefault();

        const registering = mode === "register";
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        const name = nameInput.value.trim();

        if (registering && !name) {
            showMessage(output, "Nama lengkap wajib diisi.");
            nameInput.focus();
            return;
        }

        if (password.length < 8) {
            showMessage(output, "Password minimal 8 karakter.");
            passwordInput.focus();
            return;
        }

        if (registering && password !== confirmInput.value) {
            showMessage(output, "Konfirmasi password tidak cocok.");
            confirmInput.focus();
            return;
        }

        submitButton.disabled = true;
        switchButton.disabled = true;
        output.replaceChildren();

        try {
            if (registering) {
                const result = await api("/register", {
                    method: "POST",
                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                });

                mode = "login";
                renderMode();

                emailInput.value = email;
                passwordInput.value = "";
                confirmInput.value = "";

                showMessage(
                    output,
                    result.pesan ||
                    "Akun berhasil dibuat. Silakan login.",
                    "ok"
                );

                passwordInput.focus();
                return;
            }

            const result = await api("/login", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const token = result.data?.token || result.token;

            if (!token) {
                throw new Error(
                    "Token login tidak ditemukan dari server."
                );
            }

            setToken(token);
            location.hash = "#/dashboard";
        } catch (error) {
            showMessage(output, error.message);
        } finally {
            submitButton.disabled = false;
            switchButton.disabled = false;
        }
    };
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
        <section class="page-enter">
            ${backButton("#/dashboard")}
            ${header}

            <div class="section-heading">
                <h2>Daftar buku</h2>
                <a class="btn" href="#/add">+ Tambah buku</a>
            </div>

            <div id="book-list">
                <p class="meta">Memuat buku...</p>
            </div>
        </section>
    `;

    const version = routeVersion;
    const books = await loadBooksWithAuthors();

    if (version !== routeVersion) return;

    const list = document.getElementById("book-list");
    if (!list) return;

    list.innerHTML = books.length
        ? books.map(book => `
            <a class="book glass"
               href="#/books/${encodeURIComponent(book.slug)}">
                <b>${esc(book.title)}</b>

                <div class="meta">
                    Penulis: ${esc(getAuthorName(book))}
                    · ${yearLabel(book)}
                </div>
            </a>
        `).join("")
        : `<p class="meta">Belum ada buku. Tambah buku pertama lewat tombol Tambah buku.</p>`;
}

// ========================================
// DETAIL BUKU
// ========================================

async function viewBook(slug) {
    app.innerHTML = `
        <section class="page-enter">
            ${backButton("#/books")}
            <p class="meta">Memuat detail buku...</p>
        </section>
    `;

    const result = await api("/books/" + encodeURIComponent(slug));
    const book = normalizeRecord(result);

    if (!book) {
        throw new Error("Data buku tidak ditemukan.");
    }

    let authorName = getAuthorName(book);

    if (authorName === "Belum diketahui") {
        try {
            const authors = normalizeList(await api("/authors"));
            const authorId =
                book.author_id ??
                book.authorId ??
                book.author?.id;

            const author = authors.find(item =>
                String(item.id) === String(authorId)
            );

            if (author) authorName = author.name;
        } catch {}
    }

    const actions = getToken()
        ? `
            <div class="acts">
                <a class="btn2" href="#/edit/${encodeURIComponent(book.slug)}">
                    Edit buku
                </a>

                <button class="btn2 del" id="del" type="button">
                    Hapus buku
                </button>
            </div>
        `
        : "";

    app.innerHTML = `
        <section class="page-enter">
            ${backButton("#/books")}

            <div class="glass form-card">
                <p class="meta">DETAIL KOLEKSI</p>
                <h2>${esc(book.title)}</h2>

                <p class="meta">
                    Penulis: ${esc(authorName)}
                    | Tahun: ${yearLabel(book)}
                </p>

                <p>${esc(book.description || "Deskripsi belum diisi.")}</p>

                ${actions}
                <div id="out"></div>
            </div>
        </section>
    `;

    const deleteButton = document.getElementById("del");

    if (deleteButton) {
        deleteButton.onclick = async () => {
            if (!confirm(`Hapus buku "${book.title}"? Ini nggak bisa dibatalkan.`)) {
                return;
            }

            deleteButton.disabled = true;

            try {
                await api("/books/" + encodeURIComponent(book.id), {
                    method: "DELETE"
                });

                location.hash = "#/books";
            } catch (error) {
                showMessage(
                    document.getElementById("out"),
                    error.message
                );

                deleteButton.disabled = false;
            }
        };
    }
}

// ========================================
// EDIT BUKU
// ========================================

async function viewEdit(slug) {
    if (!getToken()) {
        location.hash = "#/login";
        return;
    }

    const [bookResult, authorResult] = await Promise.all([
        api("/books/" + encodeURIComponent(slug)),
        api("/authors")
    ]);

    const book = normalizeRecord(bookResult);
    const authors = normalizeList(authorResult);

    if (!book) {
        throw new Error("Data buku tidak ditemukan.");
    }

    const selectedAuthorId =
        book.author_id ??
        book.authorId ??
        book.author?.id ??
        "";

    app.innerHTML = `
        <section class="page-enter">
            ${backButton("#/books/" + encodeURIComponent(book.slug), "Batal")}

            <div class="glass form-card">
                <p class="meta">EDIT KOLEKSI</p>
                <h2>Edit buku</h2>

                <form id="f">
                    <label for="title">Judul</label>
                    <input
                        id="title"
                        required
                        maxlength="200"
                        value="${esc(book.title)}"
                    >

                    <label for="author">Penulis</label>
                    <select id="author" required>
                        <option value="">Pilih penulis</option>

                        ${authors.map(author => `
                            <option
                                value="${esc(author.id)}"
                                ${String(author.id) === String(selectedAuthorId)
                                    ? "selected"
                                    : ""}
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
                        value="${esc(book.year ?? "")}"
                    >

                    <label for="desc">Deskripsi</label>
                    <textarea id="desc" rows="4">${esc(book.description || "")}</textarea>

                    <button class="btn" type="submit">
                        Simpan perubahan
                    </button>
                </form>

                <div id="out"></div>
            </div>
        </section>
    `;

    document.getElementById("f").onsubmit = async event => {
        event.preventDefault();

        const output = document.getElementById("out");
        const submit = event.submitter;

        if (submit) submit.disabled = true;

        const body = {
            title: document.getElementById("title").value.trim(),
            author_id: document.getElementById("author").value,
            description: document.getElementById("desc").value.trim()
        };

        const year = document.getElementById("year").value;

        if (year) {
            body.year = Number(year);
        }

        try {
            const result = await api("/books/" + encodeURIComponent(book.id), {
                method: "PATCH",
                body: JSON.stringify(body)
            });

            const updated = normalizeRecord(result);

            location.hash = "#/books/" +
                encodeURIComponent(updated?.slug || book.slug);
        } catch (error) {
            showMessage(output, error.message);

            if (submit) submit.disabled = false;
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
        <section class="page-enter">
            ${backButton("#/dashboard")}
            ${header}

            <div class="section-heading">
                <h2>Penulis</h2>

                <button class="btn2" id="toggle-author-form" type="button">
                    + Tambah penulis
                </button>
            </div>

            <div id="author-form-wrap" hidden></div>
            <div id="author-list">
                <p class="meta">Memuat penulis...</p>
            </div>
        </section>
    `;

    const toggle = document.getElementById("toggle-author-form");
    const wrap = document.getElementById("author-form-wrap");

    toggle.onclick = () => {
        wrap.hidden = !wrap.hidden;

        if (wrap.hidden) return;

        wrap.innerHTML = `
            <div class="glass form-card">
                <h2>Tambah penulis</h2>

                <form id="author-form">
                    <label for="author-name">Nama penulis</label>

                    <input
                        id="author-name"
                        required
                        maxlength="160"
                        placeholder="Masukkan nama penulis"
                    >

                    <button class="btn" type="submit">
                        Simpan penulis
                    </button>
                </form>

                <div id="author-out"></div>
            </div>
        `;

        document.getElementById("author-form").onsubmit = async event => {
            event.preventDefault();

            const output = document.getElementById("author-out");
            const name = document.getElementById("author-name").value.trim();
            const submit = event.submitter;

            if (submit) submit.disabled = true;

            try {
                await api("/authors", {
                    method: "POST",
                    body: JSON.stringify({ name })
                });

                showMessage(
                    output,
                    "Penulis berhasil ditambahkan.",
                    "ok"
                );

                document.getElementById("author-form").reset();
                await loadAuthorList();
            } catch (error) {
                showMessage(output, error.message);
            } finally {
                if (submit) submit.disabled = false;
            }
        };
    };

    await loadAuthorList();
}

async function loadAuthorList() {
    const list = document.getElementById("author-list");
    if (!list) return;

    const authors = normalizeList(await api("/authors"));

    list.innerHTML = authors.length
        ? authors.map(author => `
            <div class="book glass author-row">
                <a href="#/authors/${encodeURIComponent(author.slug || author.id)}">
                    <b>${esc(author.name)}</b>

                    <div class="meta">
                        ${Number(author.total_books ?? author.books?.length ?? 0)} buku
                    </div>
                </a>

                <div class="acts">
                    <a
                        class="btn2"
                        href="#/edit-author/${encodeURIComponent(author.id)}"
                    >
                        Edit
                    </a>

                    <button
                        class="btn2 del"
                        data-delete-author="${esc(author.id)}"
                        data-author-name="${esc(author.name)}"
                        type="button"
                    >
                        Hapus
                    </button>
                </div>
            </div>
        `).join("")
        : `<p class="meta">Belum ada data penulis.</p>`;

    list.querySelectorAll("[data-delete-author]").forEach(button => {
        button.onclick = async () => {
            const id = button.dataset.deleteAuthor;
            const name = button.dataset.authorName;

            if (!confirm(`Hapus penulis "${name}"?`)) return;

            button.disabled = true;

            try {
                await api("/authors/" + encodeURIComponent(id), {
                    method: "DELETE"
                });

                await loadAuthorList();
            } catch (error) {
                list.insertAdjacentHTML(
                    "afterbegin",
                    `<div class="msg err">${esc(error.message)}</div>`
                );

                button.disabled = false;
            }
        };
    });
}

// ========================================
// EDIT PENULIS
// ========================================

async function viewEditAuthor(id) {
    if (!getToken()) {
        location.hash = "#/login";
        return;
    }

    const authors = normalizeList(await api("/authors"));
    const author = authors.find(item => String(item.id) === String(id));

    if (!author) {
        throw new Error("Data penulis tidak ditemukan.");
    }

    app.innerHTML = `
        <section class="page-enter">
            ${backButton("#/authors")}

            <div class="glass form-card">
                <p class="meta">EDIT DATA</p>
                <h1>Edit penulis</h1>

                <form id="edit-author-form">
                    <label for="author-name">Nama penulis</label>

                    <input
                        id="author-name"
                        required
                        maxlength="160"
                        value="${esc(author.name)}"
                    >

                    <button class="btn" type="submit">
                        Simpan perubahan
                    </button>
                </form>

                <div id="author-out"></div>
            </div>
        </section>
    `;

    document.getElementById("edit-author-form").onsubmit = async event => {
        event.preventDefault();

        const output = document.getElementById("author-out");
        const submit = event.submitter;
        const name = document.getElementById("author-name").value.trim();

        if (submit) submit.disabled = true;

        try {
            await api("/authors/" + encodeURIComponent(author.id), {
                method: "PATCH",
                body: JSON.stringify({ name })
            });

            location.hash = "#/authors";
        } catch (error) {
            showMessage(output, error.message);

            if (submit) submit.disabled = false;
        }
    };
}

// ========================================
// DETAIL PENULIS
// ========================================

async function viewAuthor(slug) {
    app.innerHTML = `
        <section class="page-enter">
            ${backButton("#/authors")}
            <p class="meta">Memuat detail penulis...</p>
        </section>
    `;

    const result = await api("/authors/" + encodeURIComponent(slug));
    const author = normalizeRecord(result);

    if (!author) {
        throw new Error("Data penulis tidak ditemukan.");
    }

    const books = Array.isArray(author.books) ? author.books : [];

    app.innerHTML = `
        <section class="page-enter">
            ${backButton("#/authors")}

            <div class="glass form-card">
                <p class="meta">PROFIL PENULIS</p>
                <h2>${esc(author.name)}</h2>

                <p class="meta">
                    Jumlah buku: ${Number(author.total_books ?? books.length)}
                </p>

                ${
                    books.length
                        ? books.map(book => `
                            <a
                                class="book glass"
                                href="#/books/${encodeURIComponent(book.slug)}"
                            >
                                <b>${esc(book.title)}</b>

                                <div class="meta">
                                    ${book.year
                                        ? esc(book.year)
                                        : "Tahun belum diisi"}
                                </div>
                            </a>
                        `).join("")
                        : "<p>Penulis ini belum punya buku.</p>"
                }
            </div>
        </section>
    `;
}

// ========================================
// TAMBAH BUKU
// ========================================

async function viewAdd() {
    if (!getToken()) {
        location.hash = "#/login";
        return;
    }

    const authors = normalizeList(await api("/authors"));

    const header = hero(
        "foto1.jpg",
        "catatan baru",
        "tulis satu judul lagi untuk rak malam ini."
    );

    app.innerHTML = `
        <section class="page-enter">
            ${backButton("#/books")}
            ${header}

            <div class="glass form-card">
                <h2>Tambah buku</h2>

                ${
                    authors.length
                        ? ""
                        : `<div class="msg err">Belum ada penulis. Tambahkan penulis terlebih dahulu.</div>`
                }

                <form id="f">
                    <label for="title">Judul</label>
                    <input id="title" required maxlength="200">

                    <label for="author">Penulis</label>

                    <select id="author" required>
                        <option value="">Pilih penulis</option>

                        ${authors.map(author => `
                            <option value="${esc(author.id)}">
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
                    >

                    <label for="desc">Deskripsi</label>
                    <textarea id="desc" rows="4"></textarea>

                    <button
                        class="btn"
                        type="submit"
                        ${authors.length ? "" : "disabled"}
                    >
                        Simpan buku
                    </button>
                </form>

                <div id="out"></div>
            </div>
        </section>
    `;

    document.getElementById("f").onsubmit = async event => {
        event.preventDefault();

        const output = document.getElementById("out");
        const submit = event.submitter;

        if (submit) submit.disabled = true;

        const body = {
            title: document.getElementById("title").value.trim(),
            author_id: document.getElementById("author").value,
            description: document.getElementById("desc").value.trim()
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

            const savedBook = normalizeRecord(result);

            showMessage(
                output,
                `Buku "${savedBook?.title || body.title}" berhasil disimpan.`,
                "ok"
            );

            if (savedBook?.slug) {
                output.insertAdjacentHTML(
                    "beforeend",
                    `<p><a href="#/books/${encodeURIComponent(savedBook.slug)}">Lihat detail buku →</a></p>`
                );
            }

            event.target.reset();
        } catch (error) {
            showMessage(output, error.message);
        } finally {
            if (submit) submit.disabled = false;
        }
    };
}

// ========================================
// ROUTER
// ========================================

async function route() {
    const version = ++routeVersion;
    let current = location.hash || "#/dashboard";

    if (current.startsWith("#") && !current.startsWith("#/")) {
        current = "#/" + current.slice(1);
        history.replaceState(null, "", current);
    }

    const parts = current.slice(2).split("/");
    const page = parts[0];

    currentRoute = current;
    updateNav();

    if (
        !getToken() &&
        [
            "books",
            "authors",
            "add",
            "edit",
            "edit-author"
        ].includes(page)
    ) {
        location.hash = "#/login";
        return;
    }

    if (getToken() && page === "login") {
        location.hash = "#/dashboard";
        return;
    }

    try {
        if (page === "dashboard" || !page) {
            await viewDashboard();
        } else if (page === "profile") {
            viewProfile();
        } else if (page === "login") {
            viewLogin();
        } else if (page === "books" && parts[1]) {
            await viewBook(decodeURIComponent(parts[1]));
        } else if (page === "books") {
            await viewBooks();
        } else if (page === "authors" && parts[1]) {
            await viewAuthor(decodeURIComponent(parts[1]));
        } else if (page === "authors") {
            await viewAuthors();
        } else if (page === "add") {
            await viewAdd();
        } else if (page === "edit" && parts[1]) {
            await viewEdit(decodeURIComponent(parts[1]));
        } else if (page === "edit-author" && parts[1]) {
            await viewEditAuthor(decodeURIComponent(parts[1]));
        } else {
            location.hash = "#/dashboard";
        }
    } catch (error) {
        if (version === routeVersion) {
            showError(error);
        }
    }
}

// ========================================
// PESAN ERROR
// ========================================

function showError(error) {
    app.innerHTML = `
        <section class="page-enter">
            ${backButton("#/dashboard")}

            <div class="msg err">
                <h3>Terjadi kesalahan</h3>
                <p>${esc(error.message || "Terjadi kesalahan.")}</p>
                <p>Alamat API yang sedang digunakan: ${esc(API)}</p>

                <button class="btn2" id="retry" type="button">
                    Coba lagi
                </button>
            </div>
        </section>
    `;

    const retry = document.getElementById("retry");

    if (retry) {
        retry.onclick = route;
    }
}

// ========================================
// JALANKAN APLIKASI
// ========================================

window.addEventListener("hashchange", route);
route();
