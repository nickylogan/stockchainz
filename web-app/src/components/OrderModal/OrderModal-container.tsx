import * as React from 'react';
import { Item, Sale, RequestError } from 'utils/types';
import { default as OrderModalView } from './OrderModal-view';
import toaster from 'toasted-notes';

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

export default class OrderModal extends React.Component<Props, State> {
  state: State;

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

    Sale.requestCreate(item, amount)
      .then(_ => {
        toaster.notify('✔ Successfully placed order', {
          position: 'bottom-right',
          duration: 3000
        });
        if (handleSuccess) handleSuccess();
      })
      .catch(err => {
        toaster.notify('❌ Failed to place order: ' + RequestError.parseError(err), {
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
    const { processing, amount } = this.state;
    const { onHide, shown, item } = this.props;
    return (
      <OrderModalView
        processing={processing}
        onHide={onHide}
        shown={shown}
        item={item}
        amount={amount}
        handleChangeAmount={this.handleChangeAmount.bind(this)}
        handleDecrementAmount={this.handleDecrementAmount.bind(this)}
        handleIncrementAmount={this.handleIncrementAmount.bind(this)}
        handleSubmit={this.handleSubmit.bind(this)}
      />
    );
  }
}
