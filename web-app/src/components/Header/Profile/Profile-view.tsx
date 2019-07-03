import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavItem, Button } from 'react-bootstrap';
import NavLink from 'react-bootstrap/NavLink';

interface Props {
  name: string;
  handleSignout: () => void;
}

export default class Profile extends React.Component<Props> {
  render() {
    const { name, handleSignout } = this.props;
    return (
      <>
        <NavItem className="text-light">
          <NavLink as="span">{name}</NavLink>
        </NavItem>
        <Button className="text-light" variant="link" onClick={handleSignout}>
          <FontAwesomeIcon icon="sign-out-alt" />
        </Button>
      </>
    );
  }
}
