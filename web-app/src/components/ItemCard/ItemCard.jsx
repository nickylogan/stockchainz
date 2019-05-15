import React, { Component } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Role } from '../../utils/roles';

class ItemCard extends Component {
    render() {
        const { item, role } = this.props;
        const { orderItem, editItem, deleteItem, restockItem } = this.props;
        return (
            <Card>
                <Card.Body>
                    <Card.Title>{item.name}</Card.Title>
                    <Card.Text>
                        {item.description}<br />
                        <small>In stock: {item.amount}</small>
                    </Card.Text>
                    {
                        role === Role.SELLER ?
                            <>
                                <Button variant="secondary" onClick={() => restockItem(item)}>Restock</Button>
                                <Button variant="link" className="text-secondary" onClick={() => editItem(item)}>Edit</Button>
                                <Button variant="link" className="text-secondary" onClick={() => deleteItem(item)}>Delete</Button>
                            </> :
                            <Button onClick={() => orderItem(item)}>Order</Button>
                    }

                </Card.Body>
            </Card>
        )
    }
}

export default ItemCard;