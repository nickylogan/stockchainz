import * as React from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default class NotFound extends React.Component {
  render() {
    return (
      <Container
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ height: '100vh' }}
      >
        <h1> Oh no! Where am I?</h1>
        <p>
          Go back <Link to="/">home</Link>
        </p>
      </Container>
    );
  }
}
