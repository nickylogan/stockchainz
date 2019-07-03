import * as React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

import Loader from 'components/Loader';

interface Props {
  processing: boolean;
  shown: boolean;
  onHide: any;
  name: string;
  description: string;
  handleChangeName: (evt: any) => void;
  handleChangeDescription: (evt: any) => void;
  handleSubmit: () => void;
}

export default class AddModal extends React.Component<Props> {
  render() {
    const { shown, onHide: close, processing } = this.props;
    const { name, description } = this.props;
    const { handleChangeName, handleChangeDescription, handleSubmit } = this.props;
    return (
      <Modal show={shown} onHide={close}>
        <Modal.Header closeButton>
          <Modal.Title>Add item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Name</Form.Label>
            <Form.Control onChange={handleChangeName} placeholder="Enter name" value={name} />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description (optional)</Form.Label>
            <Form.Control
              value={description}
              onChange={handleChangeDescription}
              placeholder="Enter description (optional)"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" disabled={processing} onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" disabled={processing || !name} onClick={handleSubmit}>
            {processing && <Loader />} Submit
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
