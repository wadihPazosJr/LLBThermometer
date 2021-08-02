import * as React from "react";

import { stateArr, countryList } from ".//ImportedArrays";

import { DropDownListComponent } from "@syncfusion/ej2-react-dropdowns";
import {
  ButtonComponent,
  RadioButtonComponent,
} from "@syncfusion/ej2-react-buttons";

import {
  isEmpty,
  validEmail,
  isValidPhoneNumber,
  checkCreditCard,
  validateZipCode,
  isValidCVC,
} from "./ValidationFunctions";

export class DonationForm extends React.Component {
  handleChange(e) {
    const newState = {};
    const targetName = e.target.name;
    const targetValue = e.target.value;
    newState[targetName] = targetValue;
    this.setState(newState);
    console.log(this.state);
  }

  validate() {
    let newValidation = {
      amountError: "",
      monthlyError: "",
      nameError: "",
      emailError: "",
      phoneError: "",
      creditCardError: "",
      expirationMonthError: "",
      expirationYearError: "",
      securityCodeError: "",
      addressLinesError: "",
      cityError: "",
      stateError: "",
      countryError: "",
      postalCodeError: "",
    };

    let isError = false;

    if (!checkCreditCard(this.state.creditCard, this.state.cardType)) {
      isError = true;
      newValidation.creditCardError =
        "Either the card number provided is invalid, the number doesn't match the card type, or no number was supplied.";
    }

    if (isEmpty(this.state.amount)) {
      isError = true;
      newValidation.amountError = "Please specify an amount.";
    }

    if (isEmpty(this.state.name)) {
      isError = true;
      newValidation.nameError = "Please provide the card holder's name.";
    }

    if (isEmpty(this.state.email) || !validEmail(this.state.email)) {
      isError = true;
      newValidation.emailError = "Please provide a valid email.";
    }

    if (isEmpty(this.state.phone) || !isValidPhoneNumber(this.state.phone)) {
      isError = true;
      newValidation.phoneError = "Please provide a valid phone number.";
    }

    if (!validateZipCode(this.state.postalCode)) {
      isError = true;
      newValidation.postalCodeError = "Please provide a valid postal code.";
    }

    if (isEmpty(this.state.addressLines)) {
      isError = true;
      newValidation.addressLinesError = "Please provide an address.";
    }

    if (isEmpty(this.state.city)) {
      isError = true;
      newValidation.cityError = "Please provide a valid city.";
    }

    if (isEmpty(this.state.country)) {
      isError = true;
      newValidation.countryError = "Please provide a valid country";
    }

    if (isEmpty(this.state.state)) {
      isError = true;
      newValidation.stateError = "Please provide a valid state.";
    }

    if (isEmpty(this.state.expirationDateMonth)) {
      isError = true;
      newValidation.expirationMonthError =
        "Please provide an expiration month.";
    }

    if (isEmpty(this.state.expirationDateYear)) {
      isError = true;
      newValidation.expirationYearError = "Please provide an expiration year.";
    }

    if (!isValidCVC(this.state.securityCode)) {
      isError = true;
      newValidation.securityCodeError = "Please provide a valid security code.";
    }

    this.setState({
      validation: newValidation,
    });

    return !isError;
  }

  handleSubmit(e) {
    //When someone picks other, the value they input is a string, make sure to change to an int later on.
    e.preventDefault();
    console.log(this.state);
    console.log("hit this");

    if (this.validate()) {
      fetch("http://localhost:5000/addDonation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly: this.state.monthly,
          anonymous: this.state.anonymous,
          amount: parseInt(this.state.amount),
          name: this.state.name,
          company: this.state.company,
          creditCard: this.state.creditCard,
          expirationDate: `${this.state.expirationDateMonth}/${this.state.expirationDateYear}`,
          securityCode: this.state.securityCode,
          address: {
            addressLines: this.state.addressLines,
            city: this.state.city,
            state: this.state.state,
            country: this.state.country,
            postalCode: this.state.postalCode,
          },
          email: this.state.email,
          phone: this.state.phone,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            alert("Thank you!");
            window.location.href = "/";
          } else {
            alert("Something went wrong, please refresh and try again.");
          }
        })
        .catch((err) =>
          alert("Something went wrong, please refresh and try again.")
        );
    }
  }

  constructor() {
    super();
    this.state = {
      name: "",
      monthly: true,
      amount: "100",
      anonymous: false,
      creditCard: "",
      cardType: "",
      expirationDateMonth: "",
      expirationDateYear: "",
      securityCode: "",
      company: "",
      addressLines: "",
      city: "",
      state: "",
      country: "United States of America (the)",
      postalCode: "",
      email: "",
      phone: "",
      otherAmount: false,
      radioButtonState: {
        radioOneChecked: true,
        radioTwoChecked: false,
        radioThreeChecked: false,
        radioFourChecked: false,
      },
      radioButtonStateTwo: {
        radioOneChecked: true,
        radioTwoChecked: false,
      },
      radioButtonStateThree: {
        radioOneChecked: false,
        radioTwoChecked: true,
      },
      validation: {
        amountError: "",
        monthlyError: "",
        nameError: "",
        emailError: "",
        phoneError: "",
        creditCardError: "",
        expirationMonthError: "",
        expirationYearError: "",
        securityCodeError: "",
        addressLinesError: "",
        cityError: "",
        stateError: "",
        countryError: "",
        postalCodeError: "",
      },
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  render() {
    return (
      <div>
        <form>
          <h4>Donation Amount</h4>
          <ul style={{ listStyleType: "none" }}>
            <li>
              <RadioButtonComponent
                label="$100"
                value={100}
                checked={this.state.radioButtonState.radioOneChecked}
                change={() => {
                  let newRadioOneChecked =
                    !this.state.radioButtonState.radioOneChecked;

                  this.setState({
                    amount: newRadioOneChecked ? "100" : "",
                    radioButtonState: {
                      radioOneChecked: newRadioOneChecked,
                      radioTwoChecked: false,
                      radioThreeChecked: false,
                      radioFourChecked: false,
                    },
                  });
                  console.log(this.state);
                }}
              />
            </li>
            <li>
              <RadioButtonComponent
                label="$250"
                value={250}
                checked={this.state.radioButtonState.radioTwoChecked}
                change={() => {
                  let newRadioTwoChecked =
                    !this.state.radioButtonState.radioTwoChecked;

                  this.setState({
                    amount: newRadioTwoChecked ? "250" : "",
                    radioButtonState: {
                      radioOneChecked: false,
                      radioTwoChecked: newRadioTwoChecked,
                      radioThreeChecked: false,
                      radioFourChecked: false,
                    },
                  });
                  console.log(this.state);
                }}
              />
            </li>
            <li>
              <RadioButtonComponent
                label="$500"
                value={500}
                checked={this.state.radioButtonState.radioThreeChecked}
                change={() => {
                  let newRadioThreeChecked =
                    !this.state.radioButtonState.radioThreeChecked;

                  this.setState({
                    amount: newRadioThreeChecked ? "500" : "",
                    radioButtonState: {
                      radioOneChecked: false,
                      radioTwoChecked: false,
                      radioThreeChecked: newRadioThreeChecked,
                      radioFourChecked: false,
                    },
                  });
                  console.log(this.state);
                }}
              />
            </li>
            <li>
              <RadioButtonComponent
                label="Other"
                checked={this.state.radioButtonState.radioFourChecked}
                change={() => {
                  let newRadioFourChecked =
                    !this.state.radioButtonState.radioFourChecked;

                  this.setState({
                    amount: "",
                    radioButtonState: {
                      radioOneChecked: false,
                      radioTwoChecked: false,
                      radioThreeChecked: false,
                      radioFourChecked: newRadioFourChecked,
                    },
                  });
                  console.log(this.state);
                }}
              />
            </li>
            {this.state.radioButtonState.radioFourChecked && (
              <li>
                <input
                  placeholder="Please specify the donation amount"
                  name="amount"
                  type="number"
                  className="e-input"
                  value={this.state.amount}
                  onChange={this.handleChange}
                />
              </li>
            )}
          </ul>
          <div>{this.state.validation.amountError}</div>
          <h4>Monthly or one time donation?</h4>
          <ul style={{ listStyleType: "none" }}>
            <li>
              <RadioButtonComponent
                label="Monthly"
                checked={this.state.radioButtonStateTwo.radioOneChecked}
                change={() => {
                  let newRadioOneChecked =
                    !this.state.radioButtonStateTwo.radioOneChecked;

                  this.setState({
                    monthly: newRadioOneChecked,
                    radioButtonStateTwo: {
                      radioOneChecked: newRadioOneChecked,
                      radioTwoChecked: false,
                    },
                  });
                  console.log(this.state);
                }}
              />
            </li>
            <li>
              <RadioButtonComponent
                label="One Time"
                checked={this.state.radioButtonStateTwo.radioTwoChecked}
                change={() => {
                  let newRadioTwoChecked =
                    !this.state.radioButtonStateTwo.radioTwoChecked;

                  this.setState({
                    monthly: !newRadioTwoChecked,
                    radioButtonStateTwo: {
                      radioOneChecked: false,
                      radioTwoChecked: newRadioTwoChecked,
                    },
                  });
                  console.log(this.state);
                }}
              />
            </li>
          </ul>
          <div>{this.state.validation.monthlyError}</div>
          <h4>Would you like your donation to be anonymous?</h4>
          <ul style={{ listStyleType: "none" }}>
            <li>
              <RadioButtonComponent
                label="Yes"
                checked={this.state.radioButtonStateThree.radioOneChecked}
                change={() => {
                  let newRadioOneChecked =
                    !this.state.radioButtonStateThree.radioOneChecked;

                  this.setState({
                    anonymous: newRadioOneChecked,
                    radioButtonStateThree: {
                      radioOneChecked: newRadioOneChecked,
                      radioTwoChecked: false,
                    },
                  });
                  console.log(this.state);
                }}
              />
            </li>
            <li>
              <RadioButtonComponent
                label="No"
                checked={this.state.radioButtonStateThree.radioTwoChecked}
                change={() => {
                  let newRadioTwoChecked =
                    !this.state.radioButtonStateThree.radioTwoChecked;

                  this.setState({
                    anonymous: !newRadioTwoChecked,
                    radioButtonStateThree: {
                      radioOneChecked: false,
                      radioTwoChecked: newRadioTwoChecked,
                    },
                  });
                  console.log(this.state);
                }}
              />
            </li>
          </ul>
          <h4>Cardholder Name</h4>
          <input
            placeholder="Name on Card"
            name="name"
            type="text"
            className="e-input"
            value={this.state.name}
            onChange={this.handleChange}
          />
          <div>{this.state.validation.nameError}</div>
          <h4>Company (optional)</h4>
          <input
            placeholder="Company (Optional)"
            name="company"
            type="text"
            className="e-input"
            value={this.state.company}
            onChange={this.handleChange}
          />

          <h4>Email</h4>
          <input
            placeholder="Email"
            name="email"
            type="text"
            className="e-input"
            value={this.state.email}
            onChange={this.handleChange}
          />
          <div>{this.state.validation.emailError}</div>
          <h4>Phone Number</h4>
          <input
            placeholder="Phone Number"
            name="phone"
            type="text"
            className="e-input"
            value={this.state.phone}
            onChange={this.handleChange}
          />
          <div>{this.state.validation.phoneError}</div>
          <h4>Card Type</h4>
          <DropDownListComponent
            id="ddlelement"
            dataSource={[
              {
                text: "American Express",
                value: "AmEx",
              },
              {
                text: "Carte Blanche",
                value: "CarteBlanche",
              },
              {
                text: "Diners Club",
                value: "DinersClub",
              },
              {
                text: "enRoute",
                value: "EnRoute",
              },
              {
                text: "JCB",
                value: "JCB",
              },
              {
                text: "Maestro",
                value: "Maestro",
              },
              {
                text: "MasterCard",
                value: "MasterCard",
              },
              {
                text: "Solo",
                value: "Solo",
              },
              {
                text: "Switch",
                value: "Switch",
              },
              {
                text: "Visa",
                value: "Visa",
              },
              {
                text: "Visa Electron",
                value: "VisaElectron",
              },
              {
                text: "Laser",
                value: "LaserCard",
              },
            ]}
            fields={{ text: "text", value: "value" }}
            placeholder="Select a card type"
            value={this.state.cardType}
            change={(e) => {
              this.setState({ cardType: e.value });
            }}
          />

          {this.state.cardType !== "" && (
            <>
              <h4>Credit Card Number</h4>
              <input
                placeholder="Credit Card #"
                name="creditCard"
                type="text"
                className="e-input"
                value={this.state.creditCard}
                onChange={this.handleChange}
              />
            </>
          )}
          <div>{this.state.validation.creditCardError}</div>
          <h4>Expiration Month</h4>
          <DropDownListComponent
            id="ddlelement"
            dataSource={[
              {
                text: "January",
                value: "01",
              },
              {
                text: "February",
                value: "02",
              },
              {
                text: "March",
                value: "03",
              },
              {
                text: "April",
                value: "04",
              },
              {
                text: "May",
                value: "05",
              },
              {
                text: "June",
                value: "06",
              },
              {
                text: "July",
                value: "07",
              },
              {
                text: "August",
                value: "08",
              },
              {
                text: "September",
                value: "09",
              },
              {
                text: "October",
                value: "10",
              },
              {
                text: "November",
                value: "11",
              },
              {
                text: "December",
                value: "12",
              },
            ]}
            fields={{ text: "text", value: "value" }}
            placeholder="Month"
            value={this.state.expirationDateMonth}
            change={(e) => {
              this.setState({ expirationDateMonth: e.value });
            }}
          />
          <div>{this.state.validation.expirationMonthError}</div>
          <h4>Expiration Year (20XX)</h4>
          <input
            placeholder="Year"
            name="expirationDateYear"
            type="text"
            className="e-input"
            value={this.state.expirationDateYear}
            onChange={this.handleChange}
          />
          <div>{this.state.validation.expirationYearError}</div>
          <h4>CVC</h4>
          <input
            placeholder="CVC"
            name="securityCode"
            type="text"
            className="e-input"
            value={this.state.securityCode}
            onChange={this.handleChange}
          />
          <div>{this.state.validation.securityCodeError}</div>
          <h4>Billing Address</h4>
          <input
            placeholder="Billing Address"
            name="addressLines"
            type="text"
            className="e-input"
            value={this.state.addressLines}
            onChange={this.handleChange}
          />
          <div>{this.state.validation.addressLinesError}</div>
          <h4>City</h4>
          <input
            placeholder="City"
            name="city"
            type="text"
            className="e-input"
            value={this.state.city}
            onChange={this.handleChange}
          />
          <div>{this.state.validation.cityError}</div>
          <h4>State</h4>
          <DropDownListComponent
            id="ddlelement"
            dataSource={stateArr}
            fields={{ text: "name", value: "abbreviation" }}
            placeholder="Select a state"
            value={this.state.state}
            change={(e) => {
              this.setState({ state: e.value });
            }}
          />
          <div>{this.state.validation.stateError}</div>
          <h4>Country</h4>
          <DropDownListComponent
            id="ddlelement"
            dataSource={countryList}
            placeholder="Select a country"
            value={this.state.country}
            change={(e) => {
              this.setState({ country: e.value });
            }}
          />
          <div>{this.state.validation.countryError}</div>
          <h4>Zip Code</h4>
          <input
            placeholder="Postal Code"
            name="postalCode"
            type="text"
            className="e-input"
            value={this.state.postalCode}
            onChange={this.handleChange}
          />
          <div>{this.state.validation.postalCodeError}</div>
        </form>
        <ButtonComponent onClick={this.handleSubmit}>Donate</ButtonComponent>
      </div>
    );
  }
}
