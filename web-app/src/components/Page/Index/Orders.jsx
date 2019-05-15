import React, { Component } from 'react';
import Config from '../../../utils/config';
import FetchLoader from '../../Loader/FetchLoader';
import OrderList from '../../SaleList/OrderList';
import axios from 'axios';
import { toast } from 'react-toastify';

const testOrders = [
    {
        id: 'S_1234-asdf-5678',
        item: 'Item A',
        amount: 2,
        confirmed: true,
    },
    {
        id: 'S_5678-qwer-1234',
        item: 'Item B',
        amount: 6,
        confirmed: false,
    },
    {
        id: 'S_1234-zxcv-5678',
        item: 'Item C',
        amount: 2,
        confirmed: true,
    },
]

class Sales extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            orders: [],
        };

        this.config = new Config();

        this.requestSales = this.requestSales.bind(this);
    }

    componentDidMount() {
        this.requestSales();
    }

    requestSales() {
        axios
        .get(this.config.restServer.url + '/Sale', { withCredentials: true })
        .then(res => {
            const { data: sales } = res;
            this.setState({
                orders: sales.map(val => ({...val, confirmed: val.status === 'CONFIRMED'})),
            });
        })
        .catch(err => {
            toast.error('Cannot load sales: ' + err);
        })
        .finally(() => {
            this.setState({
                loaded: true
            });
        });
    }

    

    render() {
        const { role } = this.props;
        const { loaded } = this.state;
        return (
            <div>
                <h2>Orders</h2>
                {!loaded ? <FetchLoader /> : <OrderList role={role} orders={this.state.orders} confirmSale={this.confirmSale} />}
            </div>
        )
    }
}

export default Sales;