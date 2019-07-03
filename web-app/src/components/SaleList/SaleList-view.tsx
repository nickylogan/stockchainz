import * as React from 'react';
import { Row, Col } from 'react-bootstrap';

import { Sale, Seller } from 'utils/types';
import UnconfirmedSaleCard from './UnconfirmedSaleCard';
import ConfirmedSaleCard from './ConfirmedSaleCard';
import FetchLoader from 'components/FetchLoader';

interface Props {
  sales: Array<Sale>;
  loaded: boolean;
  role: string;
  refresh: () => void;
}

export default class SaleList extends React.Component<Props> {
  render() {
    const { sales, role, loaded, refresh } = this.props;
    return (
      <div>
        <h2>{role === Seller.TYPE ? 'Sales' : 'Orders'}</h2>
        {!loaded ? (
          <FetchLoader />
        ) : (
          <Row className="mt-4">
            <Col>
              <UnconfirmedSaleCard sales={sales.filter(sale => !sale.confirmed)} role={role} refresh={refresh} />
            </Col>
            <Col>
              <ConfirmedSaleCard sales={sales.filter(sale => sale.confirmed)} role={role} />
            </Col>
          </Row>
        )}
      </div>
    );
  }
}
