import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';
import Config from '../../utils/config';
import { NS } from '../../utils/names';
import Loader from '../Loader/Loader';

class ConfirmSaleButton extends Component {
    constructor(props) {
        super(props);

        this.config = new Config();
        this.state = {
            processing: false,
        };
    }

    confirmSale(saleID) {
        const { handleSuccess, handleError } = this.props;

        this.setState({
            processing: true,
        });

        let sale = `resource:${NS}.Sale#${saleID}`;
        axios.post(this.config.restServer.url + '/ConfirmSale', {
            '$class': `${NS}.ConfirmSale`,
            'sale': sale,
            'transactionId': '',
            'timestamp': (new Date()).toISOString(),
        }, {
            withCredentials: true,
        }).then(res => {
            toast.success(`Successfully confirmed sale #${saleID}`);
            if (handleSuccess) handleSuccess();
        }).catch(err => {
            toast.error(`Failed to confirm sale #${saleID}: ${err}`);
            if (handleError) handleError();
        }).finally(() => {
            this.setState({
                processing: false,
            });
        });
    }


    render() {
        const { saleID } = this.props;
        return (
            <Button size="sm" onClick={() => this.confirmSale(saleID)} disabled={this.state.processing}>
                { this.state.processing ? <Loader /> : <FontAwesomeIcon icon="check" /> }
            </Button>
        )
    }
}

export default ConfirmSaleButton;