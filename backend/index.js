require("dotenv").config();

const express = require("express");

const app = express();

const port = process.env.PORT || 4000;

const { MongoClient } = require("mongodb");

let database, collection;

console.log(process.env.MONGO_URI);

const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/getUpdate", async (req, res) => {
  try {
    let docCount = await collection.countDocuments();

    if (docCount === 0) {
      res.send({ success: true, total: 0, name: "", amount: "" });
    } else {
      let result = await collection
        .aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ])
        .toArray();

      let currentDonor = await collection.findOneAndUpdate(
        {
          credited: false,
        },
        {
          $set: { credited: true },
        }
      );

      res.send({
        success: true,
        total: result[0].total,
        name:
          currentDonor !== null && currentDonor.value !== null
            ? currentDonor.value.donorName
            : "",
        amount:
          currentDonor !== null && currentDonor.value !== null
            ? currentDonor.value.donationAmount
            : "",
      });
    }
  } catch (err) {
    console.log(err);
    res.send({ success: false });
  }
});

client.connect().then(() => {
  console.log("Connected to MongoDB!");
  database = client.db("llbthermometer");
  collection = database.collection("donations");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
