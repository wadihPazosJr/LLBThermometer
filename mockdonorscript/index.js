require("dotenv").config();

const express = require("express");

const app = express();

const { MongoClient, ObjectId } = require("mongodb");

let database, collection;

const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const port = process.env.PORT || 5000;

function getRandomInt() {
  return Math.floor(Math.random() * 10);
}

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

const mockDonations = [
  {
    name: "Wadih Pazos",
    amount: 200,
    credited: false,
  },
  {
    name: "Victoria Ortega",
    amount: 158,
    credited: false,
  },
  {
    name: "Wadih Sr.",
    amount: 122,
    credited: false,
  },
  {
    name: "Angie Angulo",
    amount: 24,
    credited: false,
  },
  {
    name: "Monica",
    amount: 156,
    credited: false,
  },
  {
    name: "Nicole",
    amount: 227,
    credited: false,
  },
  {
    name: "Amin",
    amount: 48,
    credited: false,
  },
  {
    name: "Amir",
    amount: 14,
    credited: false,
  },
  {
    name: "Edwin",
    amount: 189,
    credited: false,
  },
  {
    name: "Richard",
    amount: 326,
    credited: false,
  },
];

app.get("/newDonor", async (req, res) => {
  //Add new items to a collection at random time intervals

  let index = getRandomInt();

  try {
    let newItem = mockDonations[index];
    newItem._id = new ObjectId();
    await collection.insertOne(newItem);
    res.send({ success: true });
  } catch (err) {
    console.log(err);
    res.send({ success: false });
  }
});

app.get("/newMultipleDonors", async (req, res) => {
  try {
    let itemsToAdd = mockDonations.slice(0, 5);

    itemsToAdd.forEach((item) => (item._id = new ObjectId()));

    await collection.insertMany(itemsToAdd);

    res.send({ success: true });
  } catch (err) {
    console.log(err);
    res.send({ success: false });
  }
});

app.get("/reset", async (req, res) => {
  await collection.deleteMany();
  res.send({ success: true });
});

client.connect().then(() => {
  console.log("Connected to MongoDB!");
  database = client.db("llbthermometer");
  collection = database.collection("donations");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
