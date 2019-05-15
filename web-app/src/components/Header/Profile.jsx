import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavItem, Button } from 'react-bootstrap';
import NavLink from 'react-bootstrap/NavLink';

class Profile extends Component {
    render() {
        const { username, handleSignout } = this.props;
        return (
            <>
                <NavItem className="text-light">
                    <NavLink as="span">{username}</NavLink>
                </NavItem>
                <Button className="text-light" variant="link" onClick={handleSignout}>
                    <FontAwesomeIcon icon="sign-out-alt" />
                </Button>
            </>
        );
    }
}

export default Profile;