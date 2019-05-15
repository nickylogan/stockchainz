import React, { Component } from 'react';
import { Row, Col, Card, Table } from 'react-bootstrap';
import ConfirmSaleButton from '../Buttons/ConfirmSaleButton';
import { Role } from '../../utils/roles';

class OrderList extends Component {
    render() {
        const { orders, role } = this.props;
        if (orders.length === 0) {
            return (
                <p>No past orders</p>
            )
        }
        return (
            <Row className="mt-4">
                <Col>
                <Card border="secondary" className="mb-3">
                <Card.Header as="h5">Unconfirmed</Card.Header>
                <Card.Body>
                    <Table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Item</th>
                                <th>Amount</th>
                                { role === Role.SELLER ? <th></th> : <></> }
                            </tr>
                        </thead>
                        <tbody>
                            {
                                orders.filter(sale => !sale.confirmed).map((sale, index) => (
                                    <tr key={index}>
                                        <td>{sale.saleID}</td>
                                        <td>{sale.item}</td>
                                        <td>{sale.amount}</td>
                                        { role === Role.SELLER ? <td><ConfirmSaleButton saleID={sale.saleID} /></td> : <></> }
                                    </tr>
                                ))
                            }
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
                </Col>
                <Col>
                <Card border="success">
                <Card.Header as="h5">Confirmed</Card.Header>
                <Card.Body>
                    <Table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Item</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                orders.filter(order => order.confirmed).map((sale, index) => (
                                    <tr key={index}>
                                        <td>{sale.saleID}</td>
                                        <td>{sale.item}</td>
                                        <td>{sale.amount}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
                </Col>
            </Row>
        )
    }
}

export default OrderList;