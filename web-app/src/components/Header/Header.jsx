import React, { Component } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Navbar, Nav, Container } from 'react-bootstrap';
import Profile from './Profile';
import SigninButton from '../Buttons/SigninButton';

class Header extends Component {
    render() {
        const { market, user } = this.props;
        const { handleSignout } = this.props;
        return (
            <Navbar fixed="top" bg={market.color} variant="dark" className="shadow">
                <Container>
                    <LinkContainer to="/">
                        <Navbar.Brand className="col-sm-3 col-md-2 mr-0">{market.name}</Navbar.Brand>
                    </LinkContainer>
                    <Nav className="ml-auto">
                        {user ? <Profile username={user.username} handleSignout={handleSignout}/> : <></>}
                    </Nav>
                </Container>
            </Navbar>
        );
    }
}

export default Header;