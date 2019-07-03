import * as React from 'react';
import { Sale, RequestError } from 'utils/types';
import toaster from 'toasted-notes';

import { default as SaleListView } from './SaleList-view';

interface Props {
  role: string;
}

interface State {
  sales: Array<Sale>;
  loaded: boolean;
}

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
          duration: 2000
        });
      })
      .finally(() => {
        this.setState({ loaded: true });
      });
  }

  render() {
    const { role } = this.props;
    const { sales, loaded } = this.state;
    return <SaleListView role={role} sales={sales} loaded={loaded}/>;
  }
}
