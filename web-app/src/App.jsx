import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import dotenv from 'dotenv';
import { ToastContainer, toast } from 'react-toastify';
import Header from './components/Header/Header';
import Index from './components/Page/Index/Index';
import Signup from './components/Page/Signup/Signup';
import Config from './utils/config';
import axios from 'axios';

import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { NS } from './utils/names';
import { Role } from './utils/roles';

dotenv.config();

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loggedIn: false,
      market: {
        name: process.env.REACT_APP_MARKET_NAME,
        color: process.env.REACT_APP_MARKET_COLOR,
      }
    };

    this.config = new Config();

    this.handleSignin = this.handleSignin.bind(this);
    this.handleSignup = this.handleSignup.bind(this);
    this.handleSignout = this.handleSignout.bind(this);
  }

  handleSignin(username, role) {
    this.setState({
      loggedIn: true,
    });
    if (username && role) {
      this.setState({
        user: {
          username: username,
          role: role
        }
      });
    }
  }

  async handleSignup(username, role, successCallback, errorCallback) {
    const userID = username;
    const participantURL = `${this.config.accountServer.url}/${role}`;
    const $class = `${NS}.${role}`;
    const identity = {
      participant: `${$class}#${userID}`,
      userID: userID,
      options: {},
    };
    try {
      let accountExists = true;
      axios
        .get(`${participantURL}/${userID}`)
        .catch(err => {
	  if(err.response && err.response.status == 404)
	    accountExists = false;
	});

      if (!accountExists) {
        await axios.post(participantURL, {
          '$class': $class,
          [role.toLowerCase() + 'ID']: userID,
          'name': username,
        });
      }
     
      const resp = await axios.post(`${this.config.accountServer.url}/system/identities/issue`,
        identity, { responseType: 'blob' });
      const cardData = resp.data;

      const file = new File([cardData], `${userID}.card`, { type: 'application/octet-stream', lastModified: Date.now() });
      const formData = new FormData();
      formData.append('card', file);

      await axios.post(`${this.config.restServer.url}/wallet/import`, formData, {
        withCredentials: true,
        headers: {
          'content-type': 'multipart/form-data',
        }
      });

      if (successCallback) successCallback();
    } catch (err) {
      console.log(err);
      if (errorCallback) errorCallback(err);
    }
  }

  handleSignout() {
    axios
    .get(`${this.config.restServer.authURL}/logout`, {withCredentials: true})
    .then(res => {
      window.location.reload();
    })
    .catch(err => {
      toast.error('Error in signing out: ' + err);
    })
  }

  render() {
    return (
      <>
        <Header market={this.state.market} user={this.state.user} handleSignout={this.handleSignout} />
        <Container style={{ marginTop: 56 }} className="pt-4">
          <Switch>
            <Route key="0" path="/" exact={true} render={(props) =>
              <Index {...props} handleSignin={this.handleSignin} state={this.state} />
            } />
            <Route key="1" path="/signup" exact={true} render={(props) =>
              <Signup {...props} handleSignin={this.handleSignin} state={this.state} handleSignup={this.handleSignup} />
            } />
          </Switch>
        </Container>
        <ToastContainer position={toast.POSITION.BOTTOM_RIGHT} />
      </>
    );
  }
}

export default App;
