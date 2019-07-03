import * as React from 'react';
import { Item, Inventory, RequestError } from 'utils/types';
import { default as InventoryModalView } from './InventoryModal-view';
import toaster from 'toasted-notes';

interface Props {
  item: Item;
  shown: boolean;
  onHide: () => void;
}

interface State {
  inventory: Inventory;
  processing: boolean;
}

export default class InventoryModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      processing: true,
      inventory: new Inventory('', '', [])
    };
  }

  componentWillReceiveProps(props: Props) {
    const { shown, item } = props;
    if (shown) {
      this.requestInventory(item);
    }
  }

  requestInventory(item: Item) {
    this.setState({ processing: true });
    Inventory.requestOfItem(item)
      .then(inv => {
        this.setState({ inventory: inv });
      })
      .catch(err => {
        toaster.notify('❌ Unable to request inventory: ' + RequestError.parseError(err), {
          position: 'bottom-right',
          duration: 3000
        });
      })
      .finally(() => {
        this.setState({ processing: false });
      });
  }

  render() {
    const { item, shown, onHide } = this.props;
    const { inventory, processing } = this.state;
    return (
      <InventoryModalView
        item={item}
        inventory={inventory}
        shown={shown}
        processing={processing}
        onHide={onHide}
      />
    );
  }
}
