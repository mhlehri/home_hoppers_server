const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

//! schema
const HousesSchema = new mongoose.Schema({
  title: String,
  tags: String,
  category: { type: String, default: "basic" },
  article: String,
  Aemail: String,
  Aimage: String,
  Aname: String,
  image: String,
  message: { type: String, default: "" },
  publish_date: {
    type: String,
  },
  publisher: String,
  view_count: { type: Number, default: 0 },
  status: { type: String, default: "pending" },
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  role: String,
  number: Number,
  password: String,
});

const Houses = mongoose.model("Houses", HousesSchema);
const Users = mongoose.model("Users", userSchema);
// custom middleware for verifying token validity

const user = process.env.DB_USER;
const pass = process.env.DB_PASS;

mongoose
  .connect(
    `mongodb+srv://${user}:${pass}@cluster0.yynznjj.mongodb.net/` +
      "HomeDB?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("db connection established");
  });

// Curd operation
async function run() {
  try {
    const verifyToken = (req, res, next) => {
      const token = req?.cookies?.token;
      console.log("82", token);
      if (!token) {
        return res.status(401).send({ message: "unauthorized vai...." });
      }
      jwt.verify(token, secret, (err, decoded) => {
        if (err) {
          console.log("88", err.message);
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.user = decoded;
        next();
      });
    };

    //? all articles with every status
    app.get("/allHouses", async (req, res) => {
      const result = await Articles.find().sort({ publish_date: -1 });
      res.send(result);
    });

    // ? get  my Houses
    app.get("/myHouses/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email === req.user.email) {
        const result = await Houses.find({
          Aemail: email,
        });
        res.send(result);
      } else {
        res.status(403).send({ message: "unauthorized" });
      }
    });

    //? get single house
    app.get("/singleArticle/:id", async (req, res) => {
      const id = req.params.id;
      const result = await Houses.findOne({
        _id: id,
      });
      res.send(result);
    });

    //? get all users
    app.get("/users", async (req, res) => {
      const result = await Users.find();
      res.send(result);
    });
    //? get single user
    app.get("/profile/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(req.user.email);
      if (req.user.email === email) {
        const result = await Users.findOne({ email: email });
        res.send(result);
      } else {
        res.status(403).send({ message: "unauthorize access" });
      }
    });

    //? post articles
    app.post("/addHouse", async (req, res) => {
      const house = req.body;
      const housesDoc = new Houses(article);
      const result = await housesDoc.save();
      res.send(result);
    });

    //? add users
    try {
      app.post("/addUser", async (req, res) => {
        const user = req.body;
        const userEmail = user.email;
        const find = await Users.findOne({ email: userEmail });
        if (find) {
          return new Error("email already taken!");
        }
        const userDoc = new Users(user);
        const result = await userDoc.save();
        res.send(result);
      });
    } catch (error) {
      return console.log(error);
    }

    //! update articles
    app.put("/editArticles/:id", async (req, res) => {
      const id = req.params.id;
      const { publisher, image, tags, title, article } = req.body;
      const query = {};
      if (publisher) query.publisher = publisher;
      if (image) query.image = image;
      if (tags) query.tags = tags;
      if (title) query.title = title;
      if (article) query.article = article;
      const doc = await Houses.findOneAndUpdate({ _id: id }, query, {
        returnOriginal: false,
      });
      res.send(doc);
    });

    //? delete houses
    app.delete("/deleteHouse/:id", async (req, res) => {
      const id = req.params.id;
      const result = await Houses.deleteOne({ _id: id });
      res.send(result);
    });

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "24h",
      });
      console.log(token);
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("assignment running...");
});

app.listen(port, (req, res) => {
  console.log(`server listening on port ${port}`);
});
