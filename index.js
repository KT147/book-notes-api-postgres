import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "books",
  password: "1234",
  port: 5173,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let lastSearchedBook = [];

app.get("/", async (req, res) => {
  res.render("index.ejs", { books: lastSearchedBook });
});

app.post("/search", async (req, res) => {
  const searchedName = req.body.searchedBook;
  try {
    const result = await axios.get(
      `https://openlibrary.org/search.json?q=${searchedName}`
    );
    lastSearchedBook = result.data.docs;
    console.log(lastSearchedBook);
    res.render("index.ejs", { books: lastSearchedBook });
  } catch (err) {
    console.log(err);
  }
});

app.get("/details", (req, res) => {
  const bookKey = req.query.key;
  const currentBook = lastSearchedBook.find((book) => book.key === bookKey);
  if (!currentBook) return res.status(404).send("Book not found");
  console.log(currentBook);
  res.render("details.ejs", { book: currentBook });
});

app.post("/rate", async (req, res) => {
  try {
    const title = req.body.title
    const author = req.body.author
    const description = req.body.description;
    const rating = req.body.rating;
    await db.query(
      "INSERT INTO book_notes (name, description, rating, author) VALUES ($1, $2, $3, $4)",
      [title, description, rating, author]
    );
    res.redirect("/reviews");
  } catch (err) {
    console.log(err)
  }
});

app.get("/reviews", async (req, res) => {
  const result = await db.query("SELECT * FROM book_notes ORDER BY name ASC");
  const books = result.rows;

  const booksWithCovers = await Promise.all(
    books.map(async (book) => {
      try {
        const apiRes = await axios.get(
          `https://openlibrary.org/search.json?title=${encodeURIComponent(book.name)}`
        );
        const cover_i = apiRes.data.docs[0]?.cover_i || null;
        return { ...book, cover_i };
      } catch {
        return { ...book, cover_i: null };
      }
    })
  );

  res.render("reviews.ejs", { books: booksWithCovers });
});


app.get("/edit", async (req,res) => {
  const id = req.query.key;
  const result = await db.query("SELECT * FROM book_notes WHERE id = $1", [id]);
  const book = result.rows[0]
  res.render("edit.ejs", {book})
})

app.post("/edit-review", async (req,res) => {
  const id = req.body.key;
  const updatedDescription = req.body.description;
  const updatedRating = req.body.rating;
  await db.query("UPDATE book_notes SET description = ($1), rating = ($2) WHERE id = ($3)", [updatedDescription, updatedRating, id ])
  res.redirect("/reviews");
})

app.post("/delete", async (req,res) => {
  const id = req.body.key;
  await db.query("DELETE FROM book_notes WHERE id = ($1)", [id])
  res.redirect("/reviews");
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// https://openlibrary.org/search.json?q=harry+potter
// https://covers.openlibrary.org/b/id/{cover_i}-M.jpg
