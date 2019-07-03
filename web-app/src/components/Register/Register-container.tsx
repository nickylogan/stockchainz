import * as React from 'react';
import { withRouter, RouteComponentProps, Redirect } from 'react-router';
import toaster from 'toasted-notes';

import { default as RegisterView } from './Register-view';
import { Seller, Session, RequestError } from 'utils/types';

interface State {
  name: string;
  role: string;
  processing: boolean;
}

interface Props {
  session: Session;
  handleRegister: (
    name: string,
    role: string,
    successHandler?: () => void,
    errorHandler?: (err: any) => void
  ) => void;
}

type PropTypes = Props & RouteComponentProps;

class Register extends React.Component<PropTypes, State> {
  constructor(props: PropTypes) {
    super(props);
    this.state = {
      name: '',
      role: Seller.TYPE,
      processing: false
    };
  }

  handleChangeName(event: React.FormEvent<HTMLInputElement>) {
    this.setState({ name: event.currentTarget.value });
  }

  handleChangeRole(value: string, _: any) {
    this.setState({ role: value });
  }

  handleSubmit() {
    const { name, role } = this.state;
    const { handleRegister } = this.props;
    this.setState({ processing: true });

    const successHandler = () => {
      this.props.history.push('/');
    };

    const errorHandler = (err: any) => {
      toaster.notify('❌ Unable to register: ' + RequestError.parseError(err), {
        position: 'bottom-right',
        duration: 3000
      });
      this.setState({ processing: false });
    };

    handleRegister(name, role, successHandler, errorHandler);
  }

  render() {
    const { session } = this.props;
    // If not logged in, sign in first
    if (!session.loggedIn) {
      return <Redirect to="/signin" />;
    }
    // If already logged in and user is set, redirect to dashboard
    if (session.user) {
      return <Redirect to="/" />;
    }

    const { name, role, processing } = this.state;
    return (
      <RegisterView
        name={name}
        role={role}
        processing={processing}
        handleChangeName={this.handleChangeName.bind(this)}
        handleChangeRole={this.handleChangeRole.bind(this)}
        handleSubmit={this.handleSubmit.bind(this)}
      />
    );
  }
}

export default withRouter(Register);
