const fetch = require("node-fetch");

const createCheckoutTransaction = (
  amountInCents,
  transactionToken,
  headers
) => {
  return new Promise((resolve, reject) => {
    headers["Content-Type"] = "application/json";
    fetch("https://api.sky.blackbaud.com/payments/v1/checkout/transaction", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        amount: amountInCents,
        authorization_token: transactionToken,
      }),
    })
      .then(async (res) => {
        if (res.status === 201) {
          resolve({
            success: true,
            status: 201,
            transactionDetails: res.headers.get("Location"),
          });
        } else if (res.status !== 200) {
          resolve({ success: false, details: res });
        } else {
          resolve({
            success: true,
            status: 200,
            transactionDetails: await res.json(),
          });
        }
      })
      .catch((err) => reject(err));
  });
};

const getConstituentId = (constituent, headers) => {
  return new Promise(async (resolve, reject) => {
    let emailSearchResults = await getConstituentIdFromEmail(
      constituent.email,
      headers
    );

    if (emailSearchResults.success) {
      if (emailSearchResults.exists) {
        resolve({ success: true, id: emailSearchResults.id });
      } else {
        let newConstituentResult = await createConstituent(
          {
            address: {
              address_lines: constituent.addressLines,
              city: constituent.city,
              country: constituent.country,
              postal_code: constituent.zip,
              type: "Home",
            },
            email: {
              address: constituent.email,
              type: "Email",
            },
            first: constituent.name.split(" ")[0],
            last: constituent.name.split(" ")[1],
            phone: {
              number: constituent.phone,
              type: "None",
            },
            type: "Individual",
          },
          headers
        );
        if (newConstituentResult.success) {
          resolve({ success: true, id: newConstituentResult.id });
        } else {
          resolve({ success: false });
        }
      }
    } else {
      resolve({ success: false });
    }
  });
};

const getConstituentIdFromEmail = (email, headers) => {
  return new Promise((resolve, reject) => {
    fetch(
      `https://api.sky.blackbaud.com/constituent/v1/constituents/search?search_text=${email}`,
      {
        method: "GET",
        headers: headers,
      }
    )
      .then(async (res) => {
        let responseBody = await res.json();

        if (res.status !== 200) {
          resolve({ success: false, details: responseBody });
        } else {
          if (responseBody.count > 0) {
            resolve({
              success: true,
              exists: true,
              id: responseBody.value[0].id,
            });
          } else {
            resolve({ success: true, exists: false });
          }
        }
      })
      .catch((err) => reject(err));
  });
};

const createConstituent = (constituent, headers) => {
  headers["Content-Type"] = "application/json";
  return new Promise((resolve, reject) => {
    fetch("https://api.sky.blackbaud.com/constituent/v1/constituents", {
      method: "POST",
      body: JSON.stringify(constituent),
      headers: headers,
    })
      .then(async (res) => {
        let responseBody = await res.json();
        if (res.status !== 200) {
          resolve({ success: false, details: responseBody });
        } else {
          resolve({ success: true, id: responseBody.id });
        }
      })
      .catch((err) => reject(err));
  });
};

const postGift = (
  amount,
  constituentId,
  type,
  payments,
  anonymous,
  recurringGiftSchedule,
  headers
) => {
  return new Promise(async (resolve, reject) => {
    if (type === "Donation") {
      let donationGiftResponse = await createGiftSkyApi(
        {
          amount: {
            value: amount,
          },
          constituent_id: constituentId,
          gift_splits: [
            {
              amount: { value: amount },
              fund_id: "5",
            },
          ],
          type: "Donation",
          is_anonymous: anonymous,
          payments: payments,
        },
        headers
      );
      if (donationGiftResponse.success) {
        resolve({ success: true, id: donationGiftResponse.id });
      } else {
        resolve({ success: false, details: donationGiftResponse.details });
      }
    } else {
      let donationGiftResponse = await createGiftSkyApi(
        {
          amount: {
            value: amount,
          },
          post_status: "DoNotPost",
          constituent_id: constituentId,
          gift_splits: [
            {
              amount: { value: amount },
              fund_id: "5",
            },
          ],
          type: "RecurringGift",
          is_anonymous: anonymous,
          payments: payments,
          recurring_gift_schedule: recurringGiftSchedule,
        },
        headers
      );
      if (donationGiftResponse.success) {
        resolve({ success: true, id: donationGiftResponse.id });
      } else {
        resolve({ success: false, details: donationGiftResponse.details });
      }
    }
  });
};

const createGiftSkyApi = (body, headers) => {
  return new Promise((resolve, reject) => {
    headers["Content-Type"] = "application/json";
    fetch("https://api.sky.blackbaud.com/gift/v1/gifts", {
      method: "POST",
      body: JSON.stringify(body),
      headers: headers,
    })
      .then(async (res) => {
        let responseBody = await res.json();
        if (res.status !== 200) {
          resolve({ success: false, details: responseBody });
        } else {
          resolve({ success: true, id: responseBody.id });
        }
      })
      .catch((err) => reject(err));
  });
};

module.exports = { getConstituentId, createCheckoutTransaction, postGift };
