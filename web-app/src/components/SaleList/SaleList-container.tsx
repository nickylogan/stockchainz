import * as React from 'react';
import { Sale, RequestError } from 'utils/types';
import toaster from 'toasted-notes';

import { default as SaleListView } from './SaleList-view';
import Config from 'utils/config';

interface Props {
  role: string;
}

interface State {
  sales: Array<Sale>;
  loaded: boolean;
}

const config = new Config();
const wss = new WebSocket(config.restServer.wsURL);

export default class SaleList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      sales: [],
      loaded: false
    };

    this.requestSales.bind(this);
  }

  componentWillMount() {
    this.requestSales();
    wss.onmessage = evt => {
      const { $class } = JSON.parse(evt.data);
      switch($class) {
        case "com.stockchainz.net.OrderPlaced":
        case "com.stockchainz.net.SaleConfirmed":
        case "com.stockchainz.net.ItemDeleted":
          this.requestSales();
      }
    };
  }

  requestSales() {
    this.setState({ loaded: false });

    Sale.requestFetchAll()
      .then(sales => {
        this.setState({ sales });
      })
      .catch(err => {
        toaster.notify('❌ Cannot load sales: ' + RequestError.parseError(err), {
          position: 'bottom-right',
          duration: 3000
        });
      })
      .finally(() => {
        this.setState({ loaded: true });
      });
  }

  render() {
    const { role } = this.props;
    const { sales, loaded } = this.state;
    return (
      <SaleListView
        role={role}
        sales={sales}
        loaded={loaded}
        refresh={this.requestSales.bind(this)}
      />
    );
  }
}
