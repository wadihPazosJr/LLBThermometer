import * as React from "react";

import { stateArr } from ".//ImportedArrays";

import { DropDownListComponent } from "@syncfusion/ej2-react-dropdowns";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";

import { isEmpty, validEmail, isValidPhoneNumber } from "./ValidationFunctions";

export class DonationForm extends React.Component {
  handleChange(e) {
    const newState = {};
    const targetName = e.target.name;
    const targetValue = e.target.value;
    newState[targetName] = targetValue;
    this.setState(newState);
    console.log(this.state);
  }

  handleSubmit(e) {
    e.preventDefault();
    console.log(this.state);
    console.log("hit this");
    fetch("http://localhost:5000/addDonation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthly: this.state.monthly,
        anonymous: this.state.anonymous,
        amount: this.state.amount,
        name: this.state.name,
        company: this.state.company,
        creditCard: this.state.creditCard,
        expirationDate: this.state.expirationDate,
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
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  }

  constructor() {
    super();
    this.state = {
      name: "",
      monthly: "",
      amount: "",
      anonymous: "",
      creditCard: "",
      expirationDate: "",
      securityCode: "",
      company: "",
      addressLines: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      email: "",
      phone: "",
      otherAmount: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  render() {
    return (
      <div>
        <form>
          <DropDownListComponent
            id="ddlelement"
            dataSource={[1000, 5000, 10000, "Other"]}
            placeholder="What is the donation amount?"
            value={this.state.amount}
            change={(e) => {
              if (e.value !== "Other") {
                this.setState({
                  amount: e.value,
                });
              } else {
                this.setState({ otherAmount: true });
              }
            }}
          />

          {this.state.otherAmount && (
            <input
              placeholder="Please specify the donation amount"
              name="amount"
              type="number"
              className="e-input"
              value={this.state.amount}
              onChange={this.handleChange}
            />
          )}

          <DropDownListComponent
            id="ddlelement"
            dataSource={[
              {
                text: "Monthly",
                monthly: true,
              },
              {
                text: "One time",
                monthly: false,
              },
            ]}
            fields={{ text: "text", value: "monthly" }}
            placeholder="Monthly or one time donation?"
            value={this.state.monthly}
            change={(e) => {
              this.setState({
                monthly: e.value,
              });
            }}
          />
          <DropDownListComponent
            id="ddlelement"
            dataSource={[
              {
                text: "Yes",
                anonymous: true,
              },
              {
                text: "No",
                anonymous: false,
              },
            ]}
            fields={{ text: "text", value: "anonymous" }}
            placeholder="Would you like your donation to be anonymous?"
            value={this.state.anonymous}
            change={(e) => {
              this.setState({
                anonymous: e.value,
              });
            }}
          />

          <input
            placeholder="Name on Card"
            name="name"
            type="text"
            className="e-input"
            value={this.state.name}
            onChange={this.handleChange}
          />

          <input
            placeholder="Company (Optional)"
            name="company"
            type="text"
            className="e-input"
            value={this.state.company}
            onChange={this.handleChange}
          />

          <input
            placeholder="Email"
            name="email"
            type="text"
            className="e-input"
            value={this.state.email}
            onChange={this.handleChange}
          />

          <input
            placeholder="Phone Number"
            name="phone"
            type="text"
            className="e-input"
            value={this.state.phone}
            onChange={this.handleChange}
          />

          <input
            placeholder="Credit Card #"
            name="creditCard"
            type="text"
            className="e-input"
            value={this.state.creditCard}
            onChange={this.handleChange}
          />

          <input
            placeholder="Expiration Date"
            name="expirationDate"
            type="text"
            className="e-input"
            value={this.state.expirationDate}
            onChange={this.handleChange}
          />

          <input
            placeholder="CVC"
            name="securityCode"
            type="text"
            className="e-input"
            value={this.state.securityCode}
            onChange={this.handleChange}
          />

          <input
            placeholder="Billing Address"
            name="addressLines"
            type="text"
            className="e-input"
            value={this.state.addressLines}
            onChange={this.handleChange}
          />

          <input
            placeholder="City"
            name="city"
            type="text"
            className="e-input"
            value={this.state.city}
            onChange={this.handleChange}
          />

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

          <input
            placeholder="Country"
            name="country"
            type="text"
            className="e-input"
            value={this.state.country}
            onChange={this.handleChange}
          />

          <input
            placeholder="Postal Code"
            name="postalCode"
            type="text"
            className="e-input"
            value={this.state.postalCode}
            onChange={this.handleChange}
          />
        </form>
        <ButtonComponent onClick={this.handleSubmit}>Donate</ButtonComponent>
      </div>
    );
  }
}
