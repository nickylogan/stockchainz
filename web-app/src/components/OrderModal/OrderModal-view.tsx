import * as React from 'react';
import { Modal, InputGroup, Button, FormControl, Form, Col, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Loader from 'components/Loader';
import { Item } from 'utils/types';

interface Props {
  onHide: () => void;
  shown: boolean;
  item: Item;
  amount: number;
  processing: boolean;
  handleDecrementAmount: () => void;
  handleIncrementAmount: () => void;
  handleChangeAmount: (evt: any) => void;
  handleSubmit: () => void;
}

export default class OrderModal extends React.Component<Props> {
  render() {
    const { onHide: close, shown, item, amount, processing } = this.props;
    const {
      handleIncrementAmount,
      handleDecrementAmount,
      handleChangeAmount,
      handleSubmit
    } = this.props;
    return (
      <Modal show={shown} onHide={close} backdrop={processing ? 'static' : true}>
        <Modal.Header closeButton={processing}>
          <Modal.Title>Order item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <strong>You are ordering item: {item && item.name}</strong>
          <Form.Group as={Row}>
            <Col sm="6">
              <Form.Label>Amount to order: </Form.Label>
            </Col>
            <Col sm="4" className="ml-auto">
              <InputGroup size="sm">
                <InputGroup.Prepend>
                  <Button
                    disabled={amount <= 0}
                    variant="outline-secondary"
                    onClick={handleDecrementAmount}
                  >
                    <FontAwesomeIcon icon="minus" />
                  </Button>
                </InputGroup.Prepend>
                <FormControl
                  value={amount.toString()}
                  onChange={handleChangeAmount}
                  type="number"
                />
                <InputGroup.Append>
                  <Button variant="outline-secondary" onClick={handleIncrementAmount}>
                    <FontAwesomeIcon icon="plus" />
                  </Button>
                </InputGroup.Append>
              </InputGroup>
            </Col>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" disabled={processing} onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" disabled={processing || amount === 0} onClick={handleSubmit}>
            {processing && <Loader />} Submit
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
