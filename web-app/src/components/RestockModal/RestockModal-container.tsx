import * as React from 'react';
import { Item, RequestError } from 'utils/types';
import toaster from 'toasted-notes';

import { default as RestockModalView } from './RestockModal-view';

interface State {
  amount: number;
  processing: boolean;
}

interface Props {
  item: Item;
  shown: boolean;
  onHide: () => void;
  handleSuccess?: () => void;
  handleError?: (err: any) => void;
}

export default class RestockModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      amount: 0,
      processing: false
    };
  }

  handleSubmit() {
    const { item, onHide: close } = this.props;
    const { handleSuccess, handleError } = this.props;
    const { amount } = this.state;

    this.setState({ processing: true });

    Item.requestRestock(item, amount)
      .then(_ => {
        toaster.notify('✔ Successfully restocked item', {
          position: 'bottom-right',
          duration: 3000
        });
        if (handleSuccess) handleSuccess();
      })
      .catch(err => {
        console.log(err);
        toaster.notify('❌ Failed to restock item: ' + RequestError.parseError(err), {
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

  handleChangeAmount(evt: any) {
    let amount = Number.parseInt(evt.target.value);
    amount = Math.max(0, amount);
    this.setState({
      amount: amount
    });
  }

  handleIncrementAmount() {
    this.setState({
      amount: this.state.amount + 1
    });
  }

  handleDecrementAmount() {
    this.setState({
      amount: Math.max(0, this.state.amount - 1)
    });
  }

  render() {
    const { item, shown, onHide } = this.props;
    const { amount, processing } = this.state;
    return (
      <RestockModalView
        item={item}
        amount={amount}
        shown={shown}
        processing={processing}
        onHide={onHide}
        handleChangeAmount={this.handleChangeAmount.bind(this)}
        handleDecrementAmount={this.handleDecrementAmount.bind(this)}
        handleIncrementAmount={this.handleIncrementAmount.bind(this)}
        handleSubmit={this.handleSubmit.bind(this)}
      />
    );
  }
}
