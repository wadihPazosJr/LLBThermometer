import * as React from "react";
import { isEmpty, isValidPhoneNumber } from "./ValidationFunctions";
import * as $ from "jquery";
import { v4 as uuidv4 } from "uuid";

export class DonationFormDemo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      amount: "",
      amountIsOther: false,
      otherAmount: "",
      monthly: true,
      anonymous: false,
      phone: "",
      company: "",
      validation: {
        amountError: "",
        phoneError: "",
      },
    };
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.validate = this.validate.bind(this);
  }

  validate() {
    let newValidation = {
      amountError: "",
      phoneError: "",
    };

    let isError = false;

    if (
      isEmpty(this.state.amount) ||
      (this.state.amountIsOther && isEmpty(this.state.otherAmount))
    ) {
      isError = true;
      newValidation.amountError = "Please specify an amount.";
    }

    if (isEmpty(this.state.phone) || !isValidPhoneNumber(this.state.phone)) {
      isError = true;
      newValidation.phoneError = "Please provide a valid phone number.";
    }

    this.setState({ validation: newValidation });

    return !isError;
  }

  handleClick() {
    console.log(this.state);
    if (this.validate()) {
      window["Blackbaud_OpenPaymentForm"]({
        key: "3565caaf-e533-4d5f-b3db-cd53a202ff66",
        merchant_account_id: "5706882b-9524-451f-8910-d6f452b38c33",
        amount: this.state.amountIsOther
          ? this.state.otherAmount
          : this.state.amount,
        is_name_required: true,
        is_email_required: true,
        note: `Recurring:${this.state.monthly},Anonymous:${this.state.anonymous},Phone:${this.state.phone},Company:${this.state.company}`,
        card_token: this.state.monthly ? uuidv4() : null,
      });
    }
  }

  handleChange(event) {
    const newState = {};
    const targetName = event.target.name;
    const targetValue = event.target.value;
    newState[targetName] = targetValue;
    this.setState(newState);
  }

  testFunction() {
    console.log(this.state);
  }

  componentDidMount() {
    window.document.addEventListener("checkoutError", function (e) {
      // handle Error event
      console.log("error text: ", e.detail.errorText);
      console.log("error code: ", e.detail.errorCode);
      alert(
        "There was an error with processing your payment, please try again."
      );

      window.location.href = "/donate";
    });

    $(document).on("checkoutComplete", (e) => {
      fetch("/addDonation", {
        method: "POST",
        body: JSON.stringify({
          transactionToken: e.detail.transactionToken,
          donationInfo: {
            monthly: this.state.monthly,
            anonymous: this.state.anonymous,
            phone: this.state.phone,
            company: this.state.company,
            amount: this.state.amountIsOther
              ? parseFloat(this.state.otherAmount)
              : parseFloat(this.state.amount),
          },
        }),
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            alert("Thank you!");
            window.location.href = "/";
          } else {
            alert("Something went wrong, please try again.");
            window.location.href = "/donate";
          }
        })
        .catch((err) => {
          alert("Something went wrong, please try again");
          window.location.reload();
        });
    });
  }

  render() {
    return (
      <div className="container-sm">
        <div className="col-md-6 col-md-offset-3 donation-form-container">
          <form id="donation-form" className="row g-3">
            <div className="col-12">
              <label className="form-label">Donation Amount</label>
              <br />
              <select
                value={this.state.amount}
                class="custom-select"
                name="amount"
                id="normalAmount"
                onChange={(e) => {
                  if (e.target.value === "Other") {
                    this.setState(
                      { amountIsOther: true, amount: "Other" },
                      () => console.log(this.state)
                    );
                  } else {
                    this.setState(
                      {
                        amountIsOther: false,
                        amount: e.target.value,
                        otherAmount: "",
                      },
                      () => console.log(this.state)
                    );
                  }
                }}
              >
                <option selected>Please select an amount</option>
                <option value={100.0}>$100</option>
                <option value={250.0}>$250</option>
                <option value={300.0}>$500</option>
                <option value="Other">Other</option>
              </select>
              <br />
              {this.state.amountIsOther && (
                <input
                  placeholder="Please specify the donation amount..."
                  name="otherAmount"
                  type="number"
                  className="e-input"
                  id="otherAmount"
                  value={this.state.otherAmount}
                  onChange={this.handleChange}
                ></input>
              )}
              <div className="error">{this.state.validation.amountError}</div>
            </div>
            <div className="col-12">
              <label className="form-label">
                Monthly or one time donation?
              </label>
              <br />
              <select
                value={this.state.monthly}
                class="custom-select"
                name="monthly"
                onChange={this.handleChange}
              >
                <option value={true}>Monthly</option>
                <option value={false}>One Time</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">
                Would you like your donation to be anonymous?
              </label>
              <br />
              <select
                value={this.state.anonymous}
                class="custom-select"
                name="anonymous"
                onChange={this.handleChange}
              >
                <option value={true}>Yes</option>
                <option value={false}>No</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Company (Optional)</label>
              <input
                placeholder="Company"
                name="company"
                type="text"
                className="e-input"
                value={this.state.company}
                onChange={this.handleChange}
              ></input>
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone Number</label>
              <input
                placeholder="Phone Number"
                name="phone"
                type="text"
                className="e-input"
                value={this.state.phone}
                onChange={this.handleChange}
              ></input>
              <div className="error">{this.state.validation.phoneError}</div>
            </div>
          </form>
          <button id="donate-now" onClick={this.handleClick}>
            Donate Now!
          </button>
        </div>
      </div>
    );
  }
}

//test merchant id: 5706882b-9524-451f-8910-d6f452b38c33
//real merchant id: 98af0e00-6e3f-42f7-bf6b-b88f928f5bc5

//test credit card: 4242-4242-4242-4242

/* Returned when adding the transaction:
    {
  "additional_fee": 0,
  "amount": 10000,
  "application": "Payments API",
  "billing_info": {
    "city": "Miami",
    "country": "United States",
    "post_code": "33175",
    "state": "Florida",
    "street": "5423 SW 127th CT"
  },
  "comment": "Recurring: true, Anonymous: false, Phone: 7867742721, Company: Coding Angel",
  "credit_card": {
    "card_type": "Visa",
    "exp_month": 12,
    "exp_year": 2025,
    "last_four": "4242",
    "name": "Wadih Pazos"
  },
  "currency": "USD",
  "disbursement_status": "NotDisbursable",
  "donor_ip_address": "108.70.116.221",
  "email_address": "wadihjr@wpazos.com",
  "fraud_result": {
    "anonymous_proxy_result": "NotProcessed",
    "bin_and_ip_country_result": "NotProcessed",
    "high_risk_country_result": "NotProcessed",
    "result_code": "NotProcessed",
    "risk_score": 0,
    "risk_threshold": 0,
    "velocity_result": "NotProcessed"
  },
  "id": "3a216610-8fc0-4c48-a305-3fad6acd1f76",
  "is_live": false,
  "phone_number": "",
  "state": "Processed",
  "token": "00000000-0000-0000-0000-000000000000",
  "transaction_date": "8/17/2021 5:59:59 PM",
  "transaction_type": "CardNotPresent",
  "authorization_code": "123456"
}
*/
