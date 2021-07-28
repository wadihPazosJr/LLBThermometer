import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { DonationForm } from "./donationForm";
import { Range } from "./Range.js";

function App() {
  return (
    <div>
      <Router>
        <Switch>
          <Route exact path="/" component={Range}></Route>
          <Route exact path="/donate" component={DonationForm}></Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
