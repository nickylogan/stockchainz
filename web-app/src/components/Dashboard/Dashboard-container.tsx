import * as React from 'react';

import { default as DashboardView } from './Dashboard-view';
import { Redirect } from 'react-router';
import { Session } from 'utils/types';

interface Props {
  session: Session;
  handleSignout: () => void;
}

interface State {}

export default class Dashboard extends React.Component<Props, State> {
  render() {
    const { session } = this.props;
    const { handleSignout } = this.props;
    if (!session.loggedIn) {
      return <Redirect to="/signin" />;
    }
    if (!session.user) {
      return <Redirect to="/register" />;
    }
    return <DashboardView user={session.user} handleSignout={handleSignout} />;
  }
}
