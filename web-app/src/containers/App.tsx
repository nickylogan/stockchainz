import * as React from 'react';
import { Route, Switch } from 'react-router-dom';

import Dashboard from 'components/Dashboard';
import Signin from 'components/Signin';
import Register from 'components/Register';

import toaster from 'toasted-notes';
import 'toasted-notes/src/styles.css';
import './App.css';
import { Participant, Session, RequestError } from 'utils/types';
import AppLoader from 'components/AppLoader';

interface Props {}

export interface AppState {
  session?: Session;
}

export default class App extends React.Component<Props, AppState> {
  constructor(props: Props) {
    super(props);
    this.state = {};

    this.handleSignin = this.handleSignin.bind(this);
    this.handleRegister = this.handleRegister.bind(this);
    this.handleSignout = this.handleSignout.bind(this);
  }

  async componentWillMount() {
    try {
      const session = await Participant.requestSession();
      this.handleSignin(session);
    } catch (err) {
      console.log(err);
      toaster.notify('❌ Error in checking session: ' + RequestError.parseError(err), {
        position: 'bottom-right',
        duration: 2000
      });
    }
  }

  handleSignin(session: Session) {
    this.setState({ session });
  }

  handleRegister(
    name: string,
    role: string,
    successCallback?: () => void,
    errorCallback?: (err: any) => void
  ) {
    Participant.requestRegister(name, role)
      .then(user => {
        this.handleSignin({ loggedIn: true, user });
        if (successCallback) successCallback();
      })
      .catch(err => {
        toaster.notify('❌ Unable to register: ' + RequestError.parseError(err), {
          position: 'bottom-right',
          duration: 2000
        });
        if (errorCallback) errorCallback(err);
      });
  }

  handleSignout() {
    Participant.requestSignout()
      .then(_ => {
        window.location.reload();
      })
      .catch(err => {
        toaster.notify('❌ Error in signing out: ' + RequestError.parseError(err), {
          position: 'bottom-right',
          duration: 2000
        });
      });
  }

  render() {
    const { session } = this.state;
    if (!session) {
      return <AppLoader />;
    }
    return (
      <Switch>
        <Route
          key="landing"
          path="/signin"
          exact={true}
          render={props => <Signin {...props} session={session} />}
        />
        <Route
          key="register"
          path="/register"
          exact={true}
          render={props => (
            <Register {...props} session={session} handleRegister={this.handleRegister} />
          )}
        />
        <Route
          key="index"
          path="/"
          exact={true}
          render={props => (
            <Dashboard {...props} session={session} handleSignout={this.handleSignout} />
          )}
        />
      </Switch>
    );
  }
}
