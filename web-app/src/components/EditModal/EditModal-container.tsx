import * as React from 'react';
import { Item, RequestError } from 'utils/types';
import toaster from 'toasted-notes';

import { default as EditModalView } from './EditModal-view';

interface Props {
  item: Item;
  shown: boolean;
  onHide: () => void;
  handleSuccess?: () => void;
  handleError?: (err: any) => void;
}

interface State {
  name: string;
  description: string;
  processing: boolean;
}

export default class EditModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { item } = this.props;

    this.state = {
      processing: false,
      name: item ? item.name : '',
      description: item ? item.description : ''
    };
  }

  componentWillReceiveProps(props: Props) {
    const { item } = props;
    if (item && item.name === this.state.name) return;
    this.setState({
      name: item ? item.name : '',
      description: item ? item.description : ''
    });
  }

  handleChangeDescription(evt: any) {
    this.setState({ description: evt.target.value });
  }

  handleSubmit() {
    const { item, onHide: close } = this.props;
    const { handleSuccess, handleError } = this.props;
    this.setState({
      processing: true
    });

    Item.requestEdit(item, this.state.description)
      .then(_ => {
        toaster.notify('✔ Successfully updated item', {
          position: 'bottom-right',
          duration: 3000
        });
        if (handleSuccess) handleSuccess();
      })
      .catch(err => {
        toaster.notify(`❌ Failed to update item: ` + RequestError.parseError(err), {
          position: 'bottom-right',
          duration: 3000
        });
        if (handleError) handleError(err);
      })
      .finally(() => {
        this.setState({
          processing: false
        });
        close();
      });
  }

  render() {
    const { shown, onHide } = this.props;
    return (
      <EditModalView
        shown={shown}
        name={this.state.name}
        description={this.state.description}
        processing={this.state.processing}
        handleChangeDescription={this.handleChangeDescription.bind(this)}
        handleSubmit={this.handleSubmit.bind(this)}
        onHide={onHide}
      />
    );
  }
}
