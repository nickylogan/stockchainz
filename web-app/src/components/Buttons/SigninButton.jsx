import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LinkContainer } from 'react-router-bootstrap';
import Config from '../../utils/config';
import NavLink from 'react-bootstrap/NavLink';

class SigninButton extends Component {
    constructor(props) {
        super(props);
        this.config = new Config();
    }

    render() {
        return (
            <NavLink href={this.config.restServer.authURL + '/google'} className="btn btn-light btn-sm text-danger font-weight-normal mr-2 px-3">
                <FontAwesomeIcon icon={['fab', 'google']} className="mr-2" />Sign in with Google
            </NavLink>
        );
    }
}

export default SigninButton;