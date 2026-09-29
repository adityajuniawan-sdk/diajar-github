const express = require("express");

const app = express();
const port = 3000;

const meRoute = require("./routes/me");
const booksRoute = require("./routes/books");
const authorsRoute = require("./routes/authors");

app.use(express.json());

app.use("/me", meRoute);
app.use("/books", booksRoute);
app.use("/authors", authorsRoute);

app.get("/", (req, res) => {
    res.send("Server ExpressJS berhasil berjalan!");
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});