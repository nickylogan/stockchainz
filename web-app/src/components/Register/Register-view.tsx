import * as React from 'react';
import { Container, Form, Card, ToggleButtonGroup, ToggleButton, Button } from 'react-bootstrap';
import { Seller, Buyer } from 'utils/types';
import ProcessingLoader from 'components/ProcessingLoader';

interface Props {
  processing: boolean;
  name: string;
  role: string;
  handleChangeName: any;
  handleChangeRole: any;
  handleSubmit: () => void;
}

export default class Register extends React.Component<Props> {
  render() {
    const { name, role, processing } = this.props;
    const { handleChangeName, handleChangeRole, handleSubmit } = this.props;
    return (
      <Container
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ height: '100vh' }}
      >
        <Card style={{ maxWidth: '18rem' }}>
          <Card.Body>
            <h3 className="mb-4">Register as a participant</h3>
            <Form>
              <Form.Group controlId="name">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={handleChangeName}
                />
              </Form.Group>
              <Form.Group controlId="role">
                <Form.Label className="d-block">Role</Form.Label>
                <ToggleButtonGroup
                  name="role"
                  type="radio"
                  value={role}
                  onChange={handleChangeRole}
                >
                  <ToggleButton variant="light" value={Seller.TYPE} style={{ cursor: 'pointer' }}>
                    Seller
                  </ToggleButton>
                  <ToggleButton variant="light" value={Buyer.TYPE} style={{ cursor: 'pointer' }}>
                    Buyer
                  </ToggleButton>
                </ToggleButtonGroup>
              </Form.Group>
              <Button className="mt-2" variant="primary" onClick={handleSubmit} disabled={processing}>
                {processing ? <ProcessingLoader /> : 'Register'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}
