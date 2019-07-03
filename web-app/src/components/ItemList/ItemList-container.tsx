import * as React from 'react';
import { Item, RequestError, Participant } from 'utils/types';
import toaster from 'toasted-notes';

import { default as ItemListView } from './ItemList-view';

interface State {
  items: Array<Item>;
  loaded: boolean;
}

interface Props {
  user: Participant;
}

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
          duration: 2000
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
