import * as React from 'react';
import { Item, RequestError } from 'utils/types';
import toaster from 'toasted-notes';

import { default as DeleteModalView } from './DeleteModal-view';

interface State {
  processing: boolean;
}

interface Props {
  item: Item;
  shown: boolean;
  onHide: () => void;
  handleSuccess?: () => void;
  handleError?: (err: any) => void;
}

export default class DeleteModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      processing: false
    };
  }

  handleSubmit() {
    const { item, onHide: close } = this.props;
    const { handleSuccess, handleError } = this.props;

    this.setState({ processing: true });

    Item.requestDelete(item)
      .then(_ => {
        toaster.notify('✔ Successfully deleted item', {
          position: 'bottom-right',
          duration: 3000
        });
        if (handleSuccess) handleSuccess();
      })
      .catch(err => {
        toaster.notify('❌ Failed to delete item: ' + RequestError.parseError(err), {
          position: 'bottom-right',
          duration: 3000
        });
        if (handleError) handleError(err);
      })
      .finally(() => {
        this.setState({ processing: false });
        close();
      });
  }

  render() {
    const { onHide, shown, item } = this.props;
    const { processing } = this.state;
    return (
      <DeleteModalView
        onHide={onHide}
        item={item}
        shown={shown}
        processing={processing}
        handleSubmit={this.handleSubmit.bind(this)}
      />
    );
  }
}
