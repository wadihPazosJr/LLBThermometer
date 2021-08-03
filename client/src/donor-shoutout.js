import * as React from "react";
export class DonorShoutout extends React.Component {
  render() {
    return (
      <div>
        <h4 className="donor-info">
          Thank you for your donation, {this.props.name}!
        </h4>
      </div>
    );
  }
}
