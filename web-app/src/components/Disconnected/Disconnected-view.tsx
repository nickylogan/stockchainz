import * as React from 'react';
import { Container } from 'react-bootstrap';

export default class Disconnected extends React.Component {
  render() {
    return (
      <Container
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ height: '100vh' }}
      >
        <h1><span role="img" aria-label="error">❌</span> Cannot connect to server. Please try again later</h1>
      </Container>
    );
  }
}
