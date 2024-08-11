import React, { Component, Fragment } from 'react'
// import StreamApp from "./src/apps/StreamApp";
// import LoginPage from "./src/shared/login";
import ClientApp from "./src/apps/ClientApp";
import log from 'loglevel';
log.setLevel('debug');

export default class App extends Component {

  state = {}


  render() {

    return (
      <Fragment>
        {/*<StreamApp />*/}
        {/*<LoginPage />*/}
        <ClientApp />
      </Fragment>
    )
  }
}
