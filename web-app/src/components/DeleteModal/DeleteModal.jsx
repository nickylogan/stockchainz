import React, { Component } from 'react';
import { Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import { NS } from '../../utils/names';
import Config from '../../utils/config';
import { toast } from 'react-toastify';
import Loader from '../Loader/Loader';

class DeleteModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            amount: 0,
            processing: false,
        };

        this.config = new Config();

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit() {
        const { item: itemData, onHide: close } = this.props;
        const { handleSuccess, handleError } = this.props;
        this.setState({
            processing: true,
        });

        let item = `resource:${NS}.Item#${itemData.itemID}`;
        axios.post(this.config.restServer.url + '/DeleteItem', {
            '$class': `${NS}.DeleteItem`,
            'item': item,
            'transactionId': '',
            'timestamp': (new Date()).toISOString(),
        }, {
            withCredentials: true,
        }).then(res => {
            toast.success('Successfully deleted item');
            if (handleSuccess) handleSuccess();
        }).catch(err => {
            toast.error('Failed to delete item: ' + err);
            if (handleError) handleError();
        }).finally(() => {
            this.setState({
                processing: false,
            });
            close();
        });
    }

    render() {
        const { onHide: close, shown, item } = this.props;
        return (
            <Modal show={shown} onHide={close} backdrop={this.state.processing ? 'static' : true}>
                <Modal.Header closeButton={!this.state.processing}>
                    <Modal.Title>Delete item</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <strong>You are about to delete item: {item ? item.name : ''}</strong><br/>
                    <strong>Are you sure?</strong>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" disabled={this.state.processing} onClick={close}>Cancel</Button>
                    <Button variant="danger" disabled={this.state.processing} onClick={this.handleSubmit}>
                        {this.state.processing ? <Loader /> : ''} Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        )

    }
}

export default DeleteModal;