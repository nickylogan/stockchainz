import * as React from 'react';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Loader from 'components/Loader';
import { Sale } from 'utils/types';

interface Props {
  sale: Sale;
  processing: boolean;
  confirmSale: (sale: Sale) => void;
}

export default class ConfirmSaleButton extends React.Component<Props> {
  constructor(props: Props) {
    super(props);

    this.state = {
      processing: false
    };
  }

  render() {
    const { sale, processing, confirmSale } = this.props;
    return (
      <Button size="sm" onClick={() => confirmSale(sale)} disabled={processing}>
        {processing ? <Loader /> : <FontAwesomeIcon icon="check" />}
      </Button>
    );
  }
}
