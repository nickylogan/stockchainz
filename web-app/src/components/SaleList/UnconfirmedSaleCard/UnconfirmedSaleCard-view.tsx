import * as React from 'react';
import { Card, Table } from 'react-bootstrap';
import { Seller, Sale } from 'utils/types';
import ConfirmSaleButton from '../ConfirmSaleButton';
import * as _ from 'underscore.string';

interface Props {
  role: string;
  sales: Array<Sale>;
  refresh: () => void;
}

export default class UnconfirmedSaleCard extends React.Component<Props> {
  render() {
    const { role, sales, refresh } = this.props;
    return (
      <Card border="secondary" className="mb-3">
        <Card.Header as="h5">Unconfirmed</Card.Header>
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
                  {role === Seller.TYPE && <th />}
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => (
                  <tr key={index}>
                    <td>{_.truncate(sale.id, 5)}</td>
                    <td>{sale.item.name}</td>
                    <td>{sale.amount}</td>
                    {role === Seller.TYPE && (
                      <td>
                        <ConfirmSaleButton sale={sale} handleSuccess={refresh} />
                      </td>
                    )}
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
