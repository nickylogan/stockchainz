import React, { Component } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import Config from '../../utils/config';
import Loader from '../Loader/Loader';
import axios from 'axios';
import { NS } from '../../utils/names';
import { toast } from 'react-toastify';
import uuid from 'uuidv4';

class AddModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            processing: false,
            name: '',
            description: '',
        };

        this.config = new Config();

        this.handleChangeName = this.handleChangeName.bind(this);
        this.handleChangeDescription = this.handleChangeDescription.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
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
        const { onHide: close } = this.props;
        const { handleSuccess, handleError } = this.props;
        this.setState({
            processing: true,
        });

        axios.post(this.config.restServer.url + '/CreateItem', {
            '$class': `${NS}.CreateItem`,
            'itemID': 'IT_' + uuid(),
            'name': this.state.name,
            'description': this.state.description,
            'transactionId': '',
            'timestamp': (new Date()).toISOString(),
        }, { 
            withCredentials: true,
        }).then(res => {
            toast.success('Successfully created item');
            if (handleSuccess) handleSuccess();
        }).catch(err => {
            console.log(err);
            toast.error('Failed to create item: ' + err);
            if (handleError) handleError(err);
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
                    <Modal.Title>Add item</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Name</Form.Label>
                        <Form.Control onChange={this.handleChangeName} placeholder="Enter name"/>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Description (optional)</Form.Label>
                        <Form.Control onChange={this.handleChangeDescription} placeholder="Enter description (optional)"/>
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