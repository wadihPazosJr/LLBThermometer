require("dotenv").config();

const express = require("express");

/* const fetch = require("node-fetch"); */

var cors = require("cors");

const app = express();

const port = process.env.PORT || 5000;

const { MongoClient, ObjectId } = require("mongodb");

let database, collection;

const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

/* const addGift = async () => {}; // Need to implement this

const createConstituentIfItDoesntAlreadyExist = async () => {}; // Need to implement this */

/* app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
}); */
app.use(cors());
app.use(express.json());

app.post("/addDonation", async (req, res) => {
  let donation = req.body;
  //Create constituent if it doesn't already exist or get their id
  /* let constituentId = await createConstituentIfItDoesntAlreadyExist();
    //create gift in renxt
    let renxtDonation = {
      amount: {
        value: donation.amount, // should be a double
      },
      constituent_id: constituentId,
      date: null, //Need to implement this
      gift_splits: [
        {
          amount: {
            value: null, //Need to implement this
          },
          fund_id: null, //Need to implement this
        },
      ],
      type: donation.monthly ? "RecurringGift" : "Donation",
      is_anonymous: donation.anonymous,
      is_manual: null, //MAY need to implement this,
      origin: {
        name: "LLB Live Ask",
      },
      payments: [null], //May or May not need to implement this
    };

    donation.monthly
      ? (renxtDonation.recurring_gift_schedule = {
          frequency: "MONTHLY",
          start_date: null, //Need to implement this
        })
      : console.log("Not recurring.");

    let giftId = await addGift(renxtDonation); */

  //add to mongodb

  let mongoDonation = {
    _id: new ObjectId(),
    donorName: donation.name,
    donationAmount: donation.monthly ? donation.amount * 12 : donation.amount,
    credited: donation.anonymous ? true : false,
    /* giftId: giftId, */
    paymentInfo: {
      nameOnCard: donation.name,
      company: donation.company,
      creditCardNumber: donation.creditCard,
      expirationDate: donation.expirationDate,
      securityCode: donation.securityCode,
      address: {
        addressLines: donation.address.addressLines,
        city: donation.address.city,
        state: donation.address.state,
        country: donation.address.country,
        postalCode: donation.address.postalCode,
      },
      email: donation.email,
      phone: donation.phone,
      monthly: donation.monthly,
      amount: donation.amount,
    },
  };

  try {
    await collection.insertOne(mongoDonation);
    res.send({ success: true });
  } catch (err) {
    res.send({ success: false, message: err });
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
