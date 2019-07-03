import * as React from 'react';
import { Item, RequestError, Participant } from 'utils/types';
import toaster from 'toasted-notes';

import { default as ItemListView } from './ItemList-view';
import Config from 'utils/config';

interface State {
  items: Array<Item>;
  loaded: boolean;
}

interface Props {
  user: Participant;
}

const config = new Config();
const wss = new WebSocket(config.restServer.wsURL);

export default class ItemList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      items: [],
      loaded: false
    };

    this.requestItems.bind(this);
  }

  componentWillMount() {
    this.requestItems();
    wss.onmessage = evt => {
      const { $class } = JSON.parse(evt.data);
      switch($class) {
        case "com.stockchainz.net.StockChanged":
        case "com.stockchainz.net.ItemModified":
        case "com.stockchainz.net.ItemCreated":
        case "com.stockchainz.net.ItemDeleted":
          this.requestItems();
      }
    };
  }

  requestItems() {
    this.setState({ loaded: false });

    Item.requestFetchAll()
      .then(items => {
        this.setState({ items });
      })
      .catch(err => {
        toaster.notify('❌ Cannot load items: ' + RequestError.parseError(err), {
          position: 'bottom-right',
          duration: 3000
        });
      })
      .finally(() => {
        this.setState({ loaded: true });
      });
  }

  render() {
    const { items, loaded } = this.state;
    const { user } = this.props;
    return (
      <ItemListView
        items={items}
        loaded={loaded}
        user={user}
        refresh={this.requestItems.bind(this)}
      />
    );
  }
}
