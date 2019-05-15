import React, { Component } from 'react';
import { Modal, InputGroup, Button, FormControl, Form, Col, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { NS } from '../../utils/names';
import Config from '../../utils/config';
import { toast } from 'react-toastify';
import Loader from '../Loader/Loader';

class OrderModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            amount: 0,
            processing: false,
        };

        this.config = new Config();

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChangeAmount = this.handleChangeAmount.bind(this);
        this.handleDecrementAmount = this.handleDecrementAmount.bind(this);
        this.handleIncrementAmount = this.handleIncrementAmount.bind(this);
    }

    handleSubmit() {
        const { item: itemData, onHide: close } = this.props;
        const { handleSuccess, handleError } = this.props;
        const { amount } = this.state;
        this.setState({
            processing: true,
        });

        let item = `resource:${NS}.Item#${itemData.itemID}`;
        axios.post(this.config.restServer.url + '/PlaceOrder', {
            '$class': `${NS}.PlaceOrder`,
            'item': item,
            'amount': amount,
            'transactionId': '',
            'timestamp': (new Date()).toISOString(),
        }, {
            withCredentials: true,
        }).then(res => {
            toast.success('Successfully placed order');
            if (handleSuccess) handleSuccess();
        }).catch(err => {
            toast.error('Failed to place order: ' + err);
            if (handleError) handleError();
        }).finally(() => {
            this.setState({
                processing: false,
            });
            close();
        });
    }

    handleChangeAmount(evt) {
        let amount = Number.parseInt(evt.target.value);
        amount = Math.max(0, amount);
        this.setState({
            amount: amount,
        });
    }

    handleIncrementAmount() {
        this.setState({
            amount: this.state.amount + 1,
        });
    }

    handleDecrementAmount() {
        this.setState({
            amount: Math.max(0, this.state.amount - 1),
        });
    }

    render() {
        const { onHide: close, shown, item } = this.props;
        return (
            <Modal show={shown} onHide={close} backdrop={this.state.processing ? 'static' : true}>
                <Modal.Header closeButton={!this.state.processing}>
                    <Modal.Title>Order item</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <strong>You are ordering item: {item ? item.name : ''}</strong>
                    <Form.Group as={Row}>
                        <Form.Label column sm="6">Amount to order: </Form.Label>
                        <Col sm="4" className="ml-auto">
                            <InputGroup size="sm">
                                <InputGroup.Prepend>
                                    <Button disabled={this.state.amount <= 0} variant="outline-secondary" onClick={this.handleDecrementAmount}><FontAwesomeIcon icon="minus" /></Button>
                                </InputGroup.Prepend>
                                <FormControl value={this.state.amount} onChange={this.handleChangeAmount} type="number" />
                                <InputGroup.Append>
                                    <Button variant="outline-secondary" onClick={this.handleIncrementAmount}><FontAwesomeIcon icon="plus" /></Button>
                                </InputGroup.Append>
                            </InputGroup>
                        </Col>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" disabled={this.state.processing} onClick={close}>Cancel</Button>
                    <Button variant="primary" disabled={this.state.processing || this.state.amount === 0} onClick={this.handleSubmit}>
                        {this.state.processing ? <Loader /> : ''} Submit
                    </Button>
                </Modal.Footer>
            </Modal>
        )

    }
}

export default OrderModal;