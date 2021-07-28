import * as React from "react";
export class DonorShoutout extends React.Component {
  render() {
    return (
      <div className="donorShoutout">
        <h1>
          Thank you for your ${this.props.donation} donation, {this.props.name}
        </h1>
      </div>
    );
  }
}
