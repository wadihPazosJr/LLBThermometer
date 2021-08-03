require("dotenv").config();

const express = require("express");

const fetch = require("node-fetch");

var cors = require("cors");

const app = express();

const port = process.env.PORT || 5000;

const AUTHORIZATION = process.env.AUTHORIZATION;

const SUBSCRIPTION_KEY = process.env.SUBSCRIPTION_KEY;

const { MongoClient, ObjectId } = require("mongodb");

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

const getConstituentFromEmail = async (email) => {
  return new Promise(async (resolve, reject) => {
    let token = await getValidAccessToken();
    fetch(
      `https://api.sky.blackbaud.com/constituent/v1/constituents/search?search_text=${email}`,
      {
        method: "GET",
        headers: {
          "Bb-Api-Subscription-Key": SUBSCRIPTION_KEY,
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((response) => response.json())
      .then((response) => {
        if (response.count > 0) {
          resolve({ exists: true, id: response.value[0].id });
        } else {
          resolve({ exists: false });
        }
      })
      .catch((error) => reject(error));
  });
};

const createConstituent = async (constituent) => {
  return new Promise(async (resolve, reject) => {
    let token = await getValidAccessToken();

    fetch(`https://api.sky.blackbaud.com/constituent/v1/constituents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bb-Api-Subscription-Key": SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(constituent),
    })
      .then((response) => response.json())
      .then((response) => {
        resolve(response.id);
      })
      .catch((error) => reject(error));
  });
};

const createConstituentIfItDoesntAlreadyExist = async (constituent) => {
  return new Promise(async (resolve, reject) => {
    try {
      let emailResult = await getConstituentFromEmail(
        constituent.email.address
      );

      if (emailResult.exists) {
        resolve(emailResult.id);
      } else {
        let newId = await createConstituent(constituent);
        resolve(newId);
      }
    } catch (err) {
      reject(err);
    }
  });
};

const addGift = async (gift) => {
  return new Promise(async (resolve, reject) => {
    let token = await getValidAccessToken();
    fetch(`https://api.sky.blackbaud.com/gift/v1/gifts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bb-Api-Subscription-Key": SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(gift),
    })
      .then((response) => response.json())
      .then((response) => {
        resolve(response.id);
      })
      .catch((error) => reject(error));
  });
}; // Need to implement this

app.use(cors());
app.use(express.json());

app.post("/addDonation", async (req, res) => {
  let donation = req.body;

  let nameArray = donation.name.split(" ");

  let firstName = nameArray[0];

  nameArray.shift();

  let lastName = nameArray.join(" ");

  let giftId, constituentId;
  //Create constituent if it doesn't already exist or get their id
  try {
    constituentId = await createConstituentIfItDoesntAlreadyExist({
      address: {
        address_lines: donation.address.addressLines,
        city: donation.address.city,
        country: "United States",
        postal_code: donation.address.postalCode,
        state: donation.address.state,
        type: "Home",
      },
      email: {
        address: donation.email,
        type: "Email",
      },
      first: firstName,
      last: lastName,
      phone: {
        number: donation.phone,
        type: "None",
      },
      type: "Individual",
    });

    let renxtDonation = {
      amount: {
        value: donation.amount, // should be a double
      },
      constituent_id: constituentId,
      gift_splits: [
        {
          amount: {
            value: donation.amount, //Need to implement this
          },
          fund_id: "5", //Need to implement this
        },
      ],
      type: donation.monthly ? "RecurringGift" : "Donation",
      is_anonymous: donation.anonymous,
      is_manual: true, //MAY need to implement this,
      payments: [
        {
          payment_method: "CreditCard",
        },
      ], //May or May not need to implement this
    };

    donation.monthly
      ? (renxtDonation.recurring_gift_schedule = {
          frequency: "MONTHLY",
          start_date: new Date().toISOString(),
        })
      : console.log("Not recurring.");

    if (donation.monthly) {
      renxtDonation.recurring_gift_schedule = {
        frequency: "MONTHLY",
        start_date: new Date().toISOString(),
      };

      renxtDonation.post_status = "DoNotPost";
    }

    giftId = await addGift(renxtDonation);
  } catch (err) {
    giftId = "error with RENXT";
  }

  //add to mongodb

  let mongoDonation = {
    _id: new ObjectId(),
    donorName: donation.name,
    donationAmount: donation.monthly ? donation.amount * 12 : donation.amount,
    credited: donation.anonymous ? true : false,
    giftId: giftId === null ? "error with RENXT" : giftId,
    consituentId: constituentId === null ? "error with RENXT" : constituentId,
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
  authCollection = database.collection("auth");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
