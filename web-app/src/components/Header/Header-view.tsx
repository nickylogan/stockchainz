import * as React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Profile from './Profile';
import Config from 'utils/config';

const config = new Config();

interface Props {
  username: string;
  handleSignout: () => void;
}

export default class Header extends React.Component<Props> {
  render() {
    const { username } = this.props;
    const { handleSignout } = this.props;
    return (
      <Navbar fixed="top" variant="dark" bg="dark" className="shadow">
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand className="col-sm-3 col-md-2 mr-0 d-flex align-items-center">
              <Button
                size="sm"
                disabled
                variant="light"
                className="p-0 mr-2"
                style={{ opacity: 1 }}
              >
                <FontAwesomeIcon icon="store" className={`text-${config.market.color}`} />
              </Button>
              <span>{config.market.name}</span>
            </Navbar.Brand>
          </LinkContainer>
          <Nav className="ml-auto">
            <Profile name={username} handleSignout={handleSignout} />
          </Nav>
        </Container>
      </Navbar>
    );
  }
}
