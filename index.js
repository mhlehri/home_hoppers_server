const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
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
  name: String,
  address: String,
  city: String,
  bedrooms: String,
  bathrooms: String,
  size: String,
  image: String,
  date: Date,
  rent: String,
  number: String,
  des: String,
  email: String,
  owner_name: String,
  status: { type: String, default: "available" },
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  role: String,
  number: String,
  password: String,
});
const bookSchema = new mongoose.Schema({
  name: String,
  address: String,
  city: String,
  bedrooms: String,
  bathrooms: String,
  size: String,
  image: String,
  date: Date,
  rent: String,
  number: String,
  des: String,
  email: String,
  owner_name: String,
  status: String,
  R_name: String,
  R_number: String,
  R_email: String,
});

const Houses = mongoose.model("Houses", HousesSchema);
const Users = mongoose.model("Users", userSchema);
const Books = mongoose.model("Books", bookSchema);
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

    //? all houses with every status
    app.get("/allHouses", async (req, res) => {
      const { limit, page, search, size, bedrooms, city, available } =
        req.query;
      const query = {};
      if (bedrooms) query.bedrooms = bedrooms;
      if (city) query.city = city;
      if (available) query.status = available;
      if (size) {
        // Add search conditions to the query
        query.$or = [{ size: { $regex: size, $options: "i" } }];
      }
      if (search) {
        // Add search conditions to the query
        query.$or = [{ name: { $regex: search, $options: "i" } }];
      }
      const skip = (page - 1) * limit || 0;
      const result = await Houses.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);
      res.send(result);
    });

    // ? get  my Houses
    app.get("/myHouses/:email", async (req, res) => {
      const email = req.params.email;
      const result = await Houses.find({
        email: email,
      });
      console.log(result);
      res.send(result);
    });
    // ? get  my bookings
    app.get("/myBooks/:email", async (req, res) => {
      const email = req.params.email;
      const result = await Books.find({
        R_email: email,
      });
      res.send(result);
    });

    //? get single house
    app.get("/singleHouse/:id", async (req, res) => {
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
    app.get("/user", async (req, res) => {
      const { email, password } = req.query;
      try {
        const query = { email: email };
        const result = await Users.findOne(query);
        console.log(result);
        const hashed = result.password;
        const match = await bcrypt.compare(password, hashed);

        if (match) {
          res.send(result);
        } else {
          res.send({ success: false, error: "Password is incorrect" });
        }
      } catch (err) {
        console.log(err);
      }
    });

    //? add houses
    app.post("/addHouse", async (req, res) => {
      const house = req.body;
      const housesDoc = new Houses(house);
      const result = await housesDoc.save();
      res.send(result);
    });

    //? add users
    try {
      app.post("/addUser", async (req, res) => {
        const user = req.body;
        const pass = user.password;
        const hashedPassword = await bcrypt.hash(pass, 10);
        user.password = hashedPassword;
        const userDoc = new Users(user);
        const result = await userDoc.save();
        res.send(result);
      });
    } catch (error) {
      return console.log(error);
    }

    //? add bookings
    try {
      app.post("/addBook", async (req, res) => {
        const book = req.body;
        const ex = await Books.find({ email: book.email });
        if (ex.length < 2) {
          const bookDoc = new Books(book);
          const result = await bookDoc.save();
          res.send(result);
        } else {
          res.send({
            success: false,
            error: "You reached the limit (lim..: 2).",
          });
        }
      });
    } catch (error) {
      return console.log(error);
    }

    //! update articles
    app.put("/editHouse/:id", async (req, res) => {
      const id = req.params.id;
      const {
        name,
        address,
        city,
        bedrooms,
        bathrooms,
        size,
        image,
        date,
        rent,
        number,
        des,
        email,
        owner_name,
      } = req.body;
      const query = {
        name,
        address,
        city,
        bedrooms,
        bathrooms,
        size,
        image,
        date,
        rent,
        number,
        des,
        email,
        owner_name,
      };
      const doc = await Houses.findOneAndUpdate({ _id: id }, query, {
        returnOriginal: false,
      });
      res.send(doc);
    });

    app.patch("/updateStatus/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        status: "booked",
      };
      const doc = await Houses.findOneAndUpdate({ _id: id }, query, {
        returnOriginal: false,
      });
      res.send(doc);
    });

    app.patch("/updateStatusToAvailable/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        status: "available",
      };
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
    //? delete houses
    app.delete("/deleteBook/:id", async (req, res) => {
      const id = req.params.id;
      const result = await Books.deleteOne({ _id: id });
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
