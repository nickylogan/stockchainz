import * as React from 'react';
import { Inventory, Item } from 'utils/types';
import { Modal, Button, Table } from 'react-bootstrap';
import FetchLoader from 'components/FetchLoader';

interface Props {
  processing: boolean;
  item: Item;
  inventory: Inventory;
  shown: boolean;
  onHide: () => void;
}

export default class InventoryModal extends React.Component<Props> {
  render() {
    const { item, inventory, processing, shown, onHide: close } = this.props;
    return (
      <Modal show={shown} onHide={close}>
        <Modal.Header closeButton>
          <Modal.Title>Inventory data for {item.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {processing ? (
            <FetchLoader />
          ) : (
            <Table>
              <tbody>
                {inventory.changes.map((del, index) => (
                  <tr key={index}>
                    <td>{del.amount}</td>
                    <td className={'text-' + (del.amount < 0 ? 'danger' : 'success')}>
                      {del.type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={close}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
