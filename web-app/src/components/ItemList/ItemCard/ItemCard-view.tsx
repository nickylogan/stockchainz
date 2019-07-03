import * as React from 'react';
import { Button, Card } from 'react-bootstrap';
import { Seller, Buyer, Item, Participant } from 'utils/types';

interface Props {
  item: Item;
  user: Participant;
  checkInventory: (item: Item) => void;
  editItem: (item: Item) => void;
  orderItem: (item: Item) => void;
  restockItem: (item: Item) => void;
  deleteItem: (item: Item) => void;
}

export default class ItemCard extends React.Component<Props> {
  render() {
    const { item, user } = this.props;
    const { orderItem, editItem, deleteItem, restockItem, checkInventory } = this.props;
    return (
      <Card>
        <Card.Body>
          <Card.Title>
            {item.name}
            {item.seller && user.type === Seller.TYPE && user.id === item.seller.id && (
              <Button
                variant="link"
                className="ml-1 text-secondary"
                onClick={() => checkInventory(item)}
                size="sm"
              >
                <small>Details</small>
              </Button>
            )}
          </Card.Title>
          <Card.Text>
            {item.description}
            <br />
            <small>In stock: {item.amount}</small>
            <br />
            {!(item.seller && user.type === Seller.TYPE && user.id === item.seller.id) && (
              <small className="text-muted">Sold by {item.seller && item.seller.name}</small>
            )}
          </Card.Text>
          {item.seller && user.type === Seller.TYPE && user.id === item.seller.id && (
            <React.Fragment>
              <Button variant="secondary" onClick={() => restockItem(item)}>
                Restock
              </Button>
              <Button variant="link" className="text-secondary" onClick={() => editItem(item)}>
                Edit
              </Button>
              <Button variant="link" className="text-secondary" onClick={() => deleteItem(item)}>
                Delete
              </Button>
            </React.Fragment>
          )}
          {user.type === Buyer.TYPE && <Button onClick={() => orderItem(item)}>Order</Button>}
        </Card.Body>
      </Card>
    );
  }
}
