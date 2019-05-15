import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { Row } from 'react-bootstrap';
import axios from 'axios';
import SigninButton from '../../Buttons/SigninButton';
import Config from '../../../utils/config';
import Items from './Items';
import Sales from './Orders';
import { toast } from 'react-toastify';

class Index extends Component {
    constructor(props) {
        super(props);

        this.config = new Config();
    }
    componentWillMount() {
        const { handleSignin } = this.props;
        axios
            .get(`${this.config.restServer.url}/wallet`, { withCredentials: true })
            .then(async res => {
                console.log(res);
                if (res.data.length > 0) {
                    try {
                        const { data } = await axios.get(`${this.config.restServer.url}/system/ping`, { withCredentials: true });
                        const { participant } = data;
                        let $class, id;
                        [$class, id] = participant.split('#');
                        const role = $class.split('.').slice(-1).pop();
                        handleSignin(id, role);
                    } catch (err) {
                        toast.error(err);
                    }
                } else {
                    handleSignin();
                }
                
            })
            .catch(err => {
                if (!err.response || !err.response.status === 401) {
                    toast.error(err);
                }
                console.log(err.response);
            });
    }
    render() {
        const { state } = this.props;
        if (!state.loggedIn) {
            return (
                <Row className="justify-content-center mt-5">
                    <SigninButton />
                </Row>
            );
        }
        if (!state.user) {
            return (
                <Redirect to="/signup" />
            );
        }

        return (
            <>
                <Items role={state.user.role} />
                <hr />
                <Sales role={state.user.role} />
            </>
        );
    }
}

export default Index;