import * as React from 'react';
import { Card, Table } from 'react-bootstrap';
import { Sale, Seller } from 'utils/types';
import * as _ from 'underscore.string';

interface Props {
  sales: Array<Sale>;
  role: string;
}

export default class ConfirmedSaleCard extends React.Component<Props> {
  render() {
    const { role, sales } = this.props;
    return (
      <Card border="success">
        <Card.Header as="h5">Confirmed</Card.Header>
        <Card.Body>
          {sales.length === 0 ? (
            <p>No unconfirmed {role === Seller.TYPE ? 'sales' : 'orders'} </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => (
                  <tr key={index}>
                    <td>{_.truncate(sale.id, 5)}</td>
                    <td>{sale.item.name}</td>
                    <td>{sale.amount}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    );
  }
}
