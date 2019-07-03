import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';

import Loader from 'components/Loader';
import { Item } from 'utils/types';

interface Props {
  item: Item;
  shown: boolean;
  processing: boolean;
  handleSubmit: () => void;
  onHide: () => void;
}

export default class DeleteModal extends React.Component<Props> {
  render() {
    const { onHide: close, shown, item, processing } = this.props;
    const { handleSubmit } = this.props;
    return (
      <Modal show={shown} onHide={close} backdrop={processing ? 'static' : true}>
        <Modal.Header closeButton={!processing}>
          <Modal.Title>Delete item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <strong>You are about to delete item: {item && item.name}</strong>
          <br />
          <strong>Are you sure?</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" disabled={processing} onClick={close}>
            Cancel
          </Button>
          <Button variant="danger" disabled={processing} onClick={handleSubmit}>
            {processing && <Loader />} Delete
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
