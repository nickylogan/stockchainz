import * as React from 'react';
import { Container } from 'react-bootstrap';
import Loader from 'components/Loader';

export default class AppLoader extends React.Component {
  render() {
    return (
      <Container
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ height: '100vh' }}
      >
        <Loader size="5x"/>
      </Container>
    );
  }
}
