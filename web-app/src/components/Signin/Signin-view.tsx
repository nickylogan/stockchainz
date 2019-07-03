import * as React from 'react';
import { Container, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Config from 'utils/config';

const config = new Config();

export default class Signin extends React.Component {
  render() {
    return (
      <Container
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ height: '100vh' }}
      >
        <h1 className="text-monospace">Sign in to access the site</h1>
        <Button
          href={config.restServer.authURL + '/google'}
          variant="outline-light"
          className="border-danger text-danger font-weight-normal mt-2 px-3"
        >
          <FontAwesomeIcon icon={['fab', 'google']} className="mr-2" />
          <span>Sign in with Google</span>
        </Button>
      </Container>
    );
  }
}
