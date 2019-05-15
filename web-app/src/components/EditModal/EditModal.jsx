import React, { Component } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import Config from '../../utils/config';
import Loader from '../Loader/Loader';
import axios from 'axios';
import { NS } from '../../utils/names';
import { toast } from 'react-toastify';

class AddModal extends Component {
    constructor(props) {
        super(props);

        const { item } = this.props;

        this.state = {
            processing: false,
            name: item ? item.name : '',
            description: item ? item.description : '',
        };

        this.config = new Config();

        this.handleChangeName = this.handleChangeName.bind(this);
        this.handleChangeDescription = this.handleChangeDescription.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentWillReceiveProps(props) {
        const { item } = props;
        if (item && item.name === this.state.name) return;
        this.setState({
            name: item ? item.name : '',
            description: item ? item.description : '',
        });
    }

    handleChangeName(evt) {
        this.setState({
            name: evt.target.value,
        });
    }

    handleChangeDescription(evt) {
        this.setState({
            description: evt.target.value,
        });
    }

    handleSubmit() {
        const { item: itemData, onHide: close } = this.props;
        const { handleSuccess, handleError } = this.props;
        this.setState({
            processing: true,
        });

        let item = `resource:${NS}.Item#${itemData.itemID}`;
        axios.post(this.config.restServer.url + '/UpdateItem', {
            '$class': `${NS}.UpdateItem`,
            'item': item,
            'newDescription': this.state.description,
            'transactionId': '',
            'timestamp': (new Date()).toISOString(),
        }, { 
            withCredentials: true 
        }).then(res => {
            toast.success('Successfully updated item');
            if (handleSuccess) handleSuccess();
        }).catch(err => {
            toast.error(`Failed to update item #${itemData.itemID}: ` + err);
            if (handleError) handleError();
        }).finally(() => {
            this.setState({
                processing: false,
            });
            close();
        });
    }

    render() {
        const { shown, onHide: close } = this.props;
        return (
            <Modal show={shown} onHide={close}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit item</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Name</Form.Label>
                        <Form.Control value={this.state.name} disabled placeholder="Enter name" />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Description (optional)</Form.Label>
                        <Form.Control value={this.state.description} onChange={this.handleChangeDescription} placeholder="Enter description (optional)" />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" disabled={this.state.processing} onClick={close}>Cancel</Button>
                    <Button variant="primary" disabled={this.state.processing || !this.state.name} onClick={this.handleSubmit}>
                        {this.state.processing ? <Loader /> : ''} Submit
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
}

export default AddModal;