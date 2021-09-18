require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
var cors = require("cors");
const path = require("path");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ObjectId } = require("mongodb");
const AUTHORIZATION = process.env.AUTHORIZATION;
const SUBSCRIPTION_KEY = process.env.SUBSCRIPTION_KEY;
const SUBSCRIPTION_KEY_PAYMENT = process.env.SUBSCRIPTION_KEY_PAYMENT;
const {
  getConstituentId,
  createCheckoutTransaction,
  postGift,
} = require("./SkyApiFunctions");

let database, collection, authCollection;

const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

function objToFormURLEncoded(obj) {
  var formBody = [];
  for (var property in obj) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(obj[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  formBody = formBody.join("&");

  return formBody;
}

const updateToken = (refresh, access, refreshExpire, accessExpire) => {
  return new Promise((resolve, reject) => {
    let refreshTimeInSeconds = Date.now() + refreshExpire * 1000;
    let accessTimeInSeconds = Date.now() + accessExpire * 1000;
    authCollection
      .updateOne(
        { purpose: "oauth" },
        {
          $set: {
            access_token: access,
            access_expires_on: accessTimeInSeconds,
            refresh_token: refresh,
            refresh_expires_on: refreshTimeInSeconds,
          },
        }
      )
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
};

function getValidRefreshToken() {
  return new Promise(async (resolve, reject) => {
    let oauthInfo = await authCollection
      .findOne({ purpose: "oauth" })
      .catch((err) => {
        return reject(err);
      });
    resolve(oauthInfo.refresh_token);
  });
}

function refreshAccessToken() {
  return new Promise(async (resolve, reject) => {
    let newAccessToken;
    let body = {
      grant_type: "refresh_token",
      refresh_token: await getValidRefreshToken().catch((err) => {
        return reject(err);
      }),
    };
    let headers = {
      Authorization: `Basic ${AUTHORIZATION}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };

    fetch("https://oauth2.sky.blackbaud.com/token", {
      method: "POST",
      body: objToFormURLEncoded(body),
      headers: headers,
    })
      .then((res) => res.json())
      .then(async (res) => {
        let refreshToken = res.refresh_token;
        newAccessToken = res.access_token;
        let refreshExpiresIn = res.refresh_token_expires_in;
        let accessExpiresIn = res.expires_in;
        await updateToken(
          refreshToken,
          newAccessToken,
          refreshExpiresIn,
          accessExpiresIn
        )
          .then(() => {
            resolve(newAccessToken);
          })
          .catch((err) => {
            reject(err);
          });
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function getValidAccessToken() {
  return new Promise(async (resolve, reject) => {
    let accessToken;
    let accessExpiresOn;
    const result = await authCollection
      .findOne({ purpose: "oauth" })
      .catch((err) => {
        console.log(err);
        reject(err);
      });

    accessToken = result.access_token;
    accessExpiresOn = result.access_expires_on;

    let fiveMinBeforeExpire = accessExpiresOn - 300000;

    if (Date.now() >= fiveMinBeforeExpire) {
      let accessTokenRefreshed = await refreshAccessToken().catch((err) => {
        console.log(err);
        reject(err);
      });
      resolve(accessTokenRefreshed);
    } else {
      resolve(accessToken);
    }
  });
}

app.use(express.static(path.join(__dirname, "build")));

// Need to implement this
app.use(async (req, res, next) => {
  req.header = {
    "Content-Type": "",
    "Bb-Api-Subscription-Key-Standard": SUBSCRIPTION_KEY,
    "Bb-Api-Subscription-Key-Payment": SUBSCRIPTION_KEY_PAYMENT,
    Authorization: `Bearer ${await getValidAccessToken()}`,
  };
  next();
});
app.use(cors());
app.use(express.json());

app.post("/addDonation", async (req, res) => {
  const body = req.body;

  const transactionToken = body.transactionToken;

  const donationInfo = body.donationInfo;

  const donationAmountInCents = donationInfo.amount * 100;

  //Create transaction and get the resulting data.
  let postCheckoutTransactionResponse = await createCheckoutTransaction(
    donationAmountInCents,
    transactionToken,
    {
      "Content-Type": "",
      "Bb-Api-Subscription-Key": req.header["Bb-Api-Subscription-Key-Payment"],
      Authorization: req.header.Authorization,
    }
  );

  if (
    postCheckoutTransactionResponse.success &&
    postCheckoutTransactionResponse.status === 200
  ) {
    try {
      // get the id of the new or existing constituent.

      let getConstituentIdResponse = await getConstituentId(
        {
          email:
            postCheckoutTransactionResponse.transactionDetails.email_address,
          addressLines:
            postCheckoutTransactionResponse.transactionDetails.billing_info
              .street,
          city: postCheckoutTransactionResponse.transactionDetails.billing_info
            .city,
          country:
            postCheckoutTransactionResponse.transactionDetails.billing_info
              .country,
          zip: postCheckoutTransactionResponse.transactionDetails.billing_info
            .post_code,
          name: postCheckoutTransactionResponse.transactionDetails.credit_card
            .name,
          phone: donationInfo.phone,
        },
        {
          "Content-Type": "",
          "Bb-Api-Subscription-Key":
            req.header["Bb-Api-Subscription-Key-Standard"],
          Authorization: req.header.Authorization,
        }
      );

      let postGiftResponse;

      if (getConstituentIdResponse.success) {
        // create the gift
        postGiftResponse = await postGift(
          donationInfo.amount,
          getConstituentIdResponse.id,
          donationInfo.monthly ? "RecurringGift" : "Donation",
          [
            {
              checkout_transaction_id:
                postCheckoutTransactionResponse.transactionDetails.id,
              charge_transaction: true,
              bbps_configuration_id: "5706882b-9524-451f-8910-d6f452b38c33",
              payment_method: "CreditCard",
              account_token: donationInfo.monthly
                ? postCheckoutTransactionResponse.transactionDetails.token
                : null,
            },
          ],
          donationInfo.anonymous,
          donationInfo.monthly
            ? {
                frequency: "MONTHLY",
                start_date: new Date().toISOString(),
              }
            : null,
          {
            "Content-Type": "",
            "Bb-Api-Subscription-Key":
              req.header["Bb-Api-Subscription-Key-Standard"],
            Authorization: req.header.Authorization,
          }
        );
      }

      //add them to mongoDB

      let mongoDBResponse = await collection.insertOne({
        monthly: donationInfo.monthly,
        anonymous: donationInfo.anonymous,
        name: postCheckoutTransactionResponse.transactionDetails.credit_card
          .name,
        amount: donationInfo.monthly
          ? (postCheckoutTransactionResponse.transactionDetails.amount / 100) *
            12
          : postCheckoutTransactionResponse.transactionDetails.amount / 100,
        credited: donationInfo.anonymous,
        giftId: postGiftResponse.success ? postGiftResponse.id : "",
        transactionId: postCheckoutTransactionResponse.transactionDetails.id,
        constituentId: getConstituentIdResponse.success
          ? getConstituentIdResponse.id
          : "",
        company: donationInfo.company,
        phone: donationInfo.phone,
        checkoutTransactionInfo:
          postCheckoutTransactionResponse.transactionDetails,
      });

      res.send({ success: true });
    } catch (err) {
      res.send({
        success: false,
      });
    }
  } else if (
    postCheckoutTransactionResponse.success &&
    postCheckoutTransactionResponse.status === 201
  ) {
    //get the data and finish
    try {
      const transactionDetails = await fetch(
        `https://api.sky.blackbaud.com/payments${postCheckoutTransactionResponse.transactionDetails}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "",
            "Bb-Api-Subscription-Key":
              req.header["Bb-Api-Subscription-Key-Payment"],
            Authorization: req.header.Authorization,
          },
        }
      ).then((res) => res.json());

      let constituentIdResponse = await getConstituentId(
        {
          email: transactionDetails.email_address,
          addressLines: transactionDetails.billing_info.street,
          city: transactionDetails.billing_info.city,
          country: transactionDetails.billing_info.country,
          zip: transactionDetails.billing_info.post_code,
          name: transactionDetails.credit_card.name,
          phone: donationInfo.phone,
        },
        {
          "Content-Type": "",
          "Bb-Api-Subscription-Key":
            req.header["Bb-Api-Subscription-Key-Standard"],
          Authorization: req.header.Authorization,
        }
      );

      let postGiftResponse;

      if (constituentIdResponse.success) {
        // create the gift
        postGiftResponse = await postGift(
          donationInfo.amount,
          constituentIdResponse.id,
          donationInfo.monthly ? "RecurringGift" : "Donation",
          [
            {
              checkout_transaction_id: transactionDetails.id,
              charge_transaction: true,
              bbps_configuration_id: "5706882b-9524-451f-8910-d6f452b38c33",
              payment_method: "CreditCard",
              account_token: donationInfo.monthly
                ? transactionDetails.token
                : null,
            },
          ],
          donationInfo.anonymous,
          donationInfo.monthly
            ? {
                frequency: "MONTHLY",
                start_date: new Date().toISOString(),
              }
            : null,
          {
            "Content-Type": "",
            "Bb-Api-Subscription-Key":
              req.header["Bb-Api-Subscription-Key-Standard"],
            Authorization: req.header.Authorization,
          }
        );
      }

      //add them to mongoDB

      let mongoDBResponse = await collection.insertOne({
        monthly: donationInfo.monthly,
        anonymous: donationInfo.anonymous,
        name: transactionDetails.credit_card.name,
        amount: transactionDetails.amount / 100,
        credited: donationInfo.anonymous,
        giftId: postGiftResponse.success ? postGiftResponse.id : "",
        transactionId: transactionDetails.id,
        constituentId: constituentIdResponse.success
          ? constituentIdResponse.id
          : "",
        company: donationInfo.company,
        phone: donationInfo.phone,
        checkoutTransactionInfo: transactionDetails,
      });

      res.send({ success: true });
    } catch (err) {
      res.send({
        success: false,
      });
    }
  } else {
    res.send({ success: false });
  }
});

app.post("/addBackUpDonation", async (req, res) => {
  const donationInfo = req.body;

  try {
    let mongoDBResponse = await collection.insertOne({
      monthly: donationInfo.monthly,
      anonymous: donationInfo.anonymous,
      name: donationInfo.name,
      amount: donationInfo.amount,
      credited: donationInfo.anonymous,
      giftId: null,
      transactionId: null,
      constituentId: null,
      company: donationInfo.company,
      phone: donationInfo.phone,
      checkoutTransactionInfo: {
        charged: false,
        creditCard: donationInfo.creditCard,
        expirationDate: donationInfo.expirationDate,
        securityCode: donationInfo.securityCode,
        address: donationInfo.address,
        email: donationInfo.email,
      },
    });
    res.send({ success: true });
  } catch (err) {
    res.send({ sucess: false });
  }
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
            ? currentDonor.value.name
            : "",
        amount:
          currentDonor !== null && currentDonor.value !== null
            ? currentDonor.value.amount
            : "",
      });
    }
  } catch (err) {
    console.log(err);
    res.send({ success: false });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

client.connect().then(() => {
  console.log("Connected to MongoDB!");
  database = client.db("llbthermometer");
  collection = database.collection("donations");
  authCollection = database.collection("auth");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
