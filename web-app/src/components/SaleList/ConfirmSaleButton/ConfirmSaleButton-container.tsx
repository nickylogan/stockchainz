import * as React from 'react';
import { Sale, RequestError } from 'utils/types';
import { default as ConfirmSaleButtonView } from './ConfirmSaleButton-view';
import toaster from 'toasted-notes';

interface State {
  processing: boolean;
}

interface Props {
  sale: Sale;
  handleSuccess?: () => void;
  handleError?: () => void;
}

export default class ConfirmSaleButton extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      processing: false
    };
  }

  confirmSale(sale: Sale) {
    console.log(sale);

    const { handleSuccess, handleError } = this.props;

    this.setState({ processing: true });

    Sale.requestConfirm(sale)
      .then(_ => {
        toaster.notify(`✔ Successfully confirmed sale #${sale.id}`, {
          position: 'bottom-right',
          duration: 3000
        });
        if (handleSuccess) handleSuccess();
      })
      .catch(err => {
        toaster.notify(`❌ Failed to confirm sale: ` + RequestError.parseError(err), {
          position: 'bottom-right',
          duration: 3000
        });
        if (handleError) handleError();
      })
      .finally(() => {
        this.setState({ processing: false });
      });
  }

  render() {
    const { processing } = this.state;
    const { sale } = this.props;

    return (
      <ConfirmSaleButtonView
        processing={processing}
        sale={sale}
        confirmSale={this.confirmSale.bind(this)}
      />
    );
  }
}
