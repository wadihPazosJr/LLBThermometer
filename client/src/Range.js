import "./index.css";
/**
 * Sample for Ranges
 */
import * as React from "react";
import {
  LinearGaugeComponent,
  AxesDirective,
  AxisDirective,
  Inject,
  PointersDirective,
  PointerDirective,
  Annotations,
  Gradient,
} from "@syncfusion/ej2-react-lineargauge";

import { DonorShoutout } from "./donor-shoutout";

export class Range extends React.Component {
  /* onclick() {
    this.gaugeInstance.axes[0].pointers[0].value = 125;
  } */

  constructor() {
    super();
    this.state = {
      currentDonor: "",
      currentDonorAmount: "",
      gaugeValue: 0,
      donationGoal: 100000,
      matchGoal: 20000,
    };
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      fetch("/getUpdate")
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            if (res.total !== this.state.gaugeValue) {
              this.setState({ gaugeValue: res.total });
            }

            if (
              res.name !== "" &&
              res.amount !== "" &&
              (res.name !== this.state.currentDonor ||
                res.amount !== this.state.currentDonorAmount)
            ) {
              this.setState({
                currentDonor: res.name,
                currentDonorAmount: res.amount,
              });
            }
          }
        })
        .catch((err) => console.log(err));
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  onLabelRender(args) {
    if (args.axis.visibleRange.min === args.value) {
      args.text = "$" + args.value;
      args.axis.labelStyle.font.color = "black";
    } else if (args.axis.visibleRange.max === args.value) {
      args.text = "$" + args.value;
      args.axis.labelStyle.font.color = "black";
    } else if (
      args.axis.pointers[0].value === args.value ||
      args.axis.pointers[0].value === args.value + 5
    ) {
      args.text = "$" + args.axis.pointers[0].value;
      args.axis.labelStyle.font.color = "black";
    } else {
      args.text = "";
    }
  }
  render() {
    return (
      <div className="thermometerContainer">
        <div className="thermometerContent">
          {/* <div className="control-section row">
          <div className="col-lg-8"> */}
          <LinearGaugeComponent
            ref={(gauge) => (this.gaugeInstance = gauge)}
            axisLabelRender={this.onLabelRender.bind(this)}
            width="400px"
            height="400px"
            id="lineargauge"
            container={{
              animationduration: 3000,
              width: 13,
              type: "Thermometer",
              border: {
                color: "black",
                width: 15,
              },
            }}
          >
            <Inject services={[Annotations, Gradient]} />

            <AxesDirective>
              <AxisDirective
                minimum={0}
                maximum={this.state.donationGoal}
                line={{ width: 0 }}
                minorTicks={{ interval: 2000, color: "#9e9e9e", offset: -20 }}
                majorTicks={{
                  offset: -20,
                  interval: 10000,
                  color: "#9e9e9e",
                }}
                labelStyle={{ font: { color: "white" } }}
              >
                <PointersDirective>
                  <PointerDirective
                    animationDuration={3000}
                    value={this.state.gaugeValue}
                    height={13}
                    width={13}
                    type="Bar"
                    color={
                      this.state.gaugeValue >= this.state.donationGoal
                        ? "#008000"
                        : "#f02828"
                    }
                    linearGradient={{
                      startValue: "0%",
                      endValue: "100%",
                      colorStop: [
                        {
                          color:
                            this.state.gaugeValue >= this.state.donationGoal
                              ? "#008000"
                              : "#FF0000",
                          offset: "0%",
                          opacity: 1,
                        },
                        {
                          color:
                            this.state.gaugeValue >= this.state.donationGoal
                              ? "#008000"
                              : "#8B0000",
                          offset: "100%",
                          opacity: 1,
                        },
                      ],
                    }}
                  />
                </PointersDirective>
              </AxisDirective>
              <AxisDirective
                minimum={0}
                maximum={this.state.donationGoal}
                opposedPosition={true}
                line={{ width: 0 }}
                majorTicks={{ interval: 10000, offset: 20 }}
                minorTicks={{ interval: 2000, offset: 20 }}
                labelStyle={{ font: { color: "white" } }}
              >
                <PointersDirective>
                  <PointerDirective width={0} />
                </PointersDirective>
              </AxisDirective>
            </AxesDirective>
          </LinearGaugeComponent>

          <div>Current amount: ${this.state.gaugeValue}</div>

          {this.state.matchGoal - this.state.gaugeValue > 0 ? (
            <div>
              ${this.state.matchGoal - this.state.gaugeValue} left for Walmart
              to match ${this.state.matchGoal} raised!
            </div>
          ) : (
            <div>Walmart has matched ${this.state.matchGoal} raised!</div>
          )}
          {this.state.gaugeValue >= this.state.donationGoal ? (
            <div>Goal of ${this.state.donationGoal} reached! Thank you!</div>
          ) : (
            <div>
              ${this.state.donationGoal - this.state.gaugeValue} left to reach
              our goal!
            </div>
          )}
          {this.state.currentDonor !== "" && (
            <DonorShoutout
              donation={this.state.currentDonorAmount}
              name={this.state.currentDonor}
            />
          )}
        </div>
      </div>
    );
  }
}
