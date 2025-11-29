import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "permalist",
  password: "1234",
  port: 5173,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


app.get("/", async (req, res) => {
  res.render("index.ejs");
});

app.post("/search", async (req, res) => {
  const searchedName = req.body.searchedBook;
  try {
    const result = await axios.get(
      `https://openlibrary.org/search.json?q=${searchedName}`
    );
    const books = result.data.docs;
    console.log(books);
    res.render("index.ejs", {books});
  } catch (err) {
    console.log(err);
  }
});

app.get('/details', (req,res) => {
    res.render("details.ejs", {currentBooks})
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// https://openlibrary.org/search.json?q=harry+potter
// https://covers.openlibrary.org/b/id/{cover_i}-M.jpg
