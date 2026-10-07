const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("./db");

const app = express();
const port = 3000;

const meRoute = require("./routes/me");
const booksRoute = require("./routes/books");
const authorsRoute = require("./routes/authors");

app.use(express.json());

app.use("/me", meRoute);
app.use("/books", booksRoute);
app.use("/authors", authorsRoute);


// =========================
// REGISTER
// =========================
app.post("/register", async (req, res) => {
    try {
        const { nama, email, password } = req.body;

        // Cek data kosong
        if (!nama || !email || !password) {
            return res.status(400).json({
                message: "Nama, email, dan password wajib diisi"
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Simpan user ke database
        const user = await prisma.users.create({
            data: {
                name: nama,
                email: email,
                password: passwordHash
            }
        });

        res.status(201).json({
            message: "Register berhasil",
            user: {
                id: user.id.toString(),
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Register gagal",
            error: error.message
        });
    }
});


// =========================
// LOGIN
// =========================
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Cek data kosong
        if (!email || !password) {
            return res.status(400).json({
                message: "Email dan password wajib diisi"
            });
        }

        // Cari user berdasarkan email
        const user = await prisma.users.findUnique({
            where: {
                email: email
            }
        });

        // Kalau user tidak ditemukan
        if (!user) {
            return res.status(401).json({
                message: "Email atau password salah"
            });
        }

        // Cek password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Email atau password salah"
            });
        }

        // Buat JWT
        const token = jwt.sign(
            {
                sub: user.id.toString(),
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        // Kirim token
        res.json({
            message: "Login berhasil",
            token: token,
            user: {
                id: user.id.toString(),
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login gagal",
            error: error.message
        });
    }
});


// =========================
// ROOT
// =========================
app.get("/", (req, res) => {
    res.send("Server ExpressJS berhasil berjalan!");
});


// =========================
// SERVER
// =========================
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});