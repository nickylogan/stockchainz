import * as React from 'react';
import { default as SigninView } from './Signin-view';
import { Redirect } from 'react-router';
import { Session } from 'utils/types';

interface State {}

interface Props {
  session: Session;
}

export default class Signin extends React.Component<Props, State> {
  render() {
    const { session } = this.props;
    if (session.loggedIn) {
      return <Redirect to={session.user ? '/' : '/register'} />;
    }
    return <SigninView />;
  }
}
