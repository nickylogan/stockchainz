import React, { Component } from 'react';
import FetchLoader from '../../Loader/FetchLoader';
import Config from '../../../utils/config';
import axios from 'axios';
import { Button, CardColumns } from 'react-bootstrap';
import ItemCard from '../../ItemCard/ItemCard';
import OrderModal from '../../OrderModal/OrderModal';
import AddModal from '../../AddModal/AddModal';
import EditModal from '../../EditModal/EditModal';
import DeleteModal from '../../DeleteModal/DeleteModal';
import RestockModal from '../../RestockModal/RestockModal';
import { Role } from '../../../utils/roles';
import { toast } from 'react-toastify';

const testItems = [
    {
        id: "I_1234-A",
        name: "Item A",
        description: "Item named A",
        amount: 10,
    },
    {
        id: "I_1234-B",
        name: "Item B",
        description: "Item named B",
        amount: 3,
    },
    {
        id: "I_1234-C",
        name: "Item C",
        description: "Item named C",
        amount: 5,
    },
];


class Items extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            items: [],
            addModalOpen: false,
            orderModalOpen: false,
            editModalOpen: false,
            deleteModalOpen: false,
            restockModalOpen: false,
        };

        this.config = new Config();

        this.requestItems = this.requestItems.bind(this);
        this.openAddModal = this.openAddModal.bind(this);
        this.openOrderModal = this.openOrderModal.bind(this);
        this.openEditModal = this.openEditModal.bind(this);
        this.openDeleteModal = this.openDeleteModal.bind(this);
        this.openRestockModal = this.openRestockModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }

    componentWillMount() {
        this.requestItems();
    }

    openAddModal() {
        this.setState({
            addModalOpen: true,
        });
    }

    openOrderModal(item) {
        this.setState({
            orderModalOpen: true,
            itemForOrder: item,
        });
    }

    openEditModal(item) {
        this.setState({
            editModalOpen: true,
            itemForEdit: item,
        });
    }

    openDeleteModal(item) {
        this.setState({
            deleteModalOpen: true,
            itemForDelete: item,
        });
    }

    openRestockModal(item) {
        this.setState({
            restockModalOpen: true,
            itemForRestock: item,
        });
    }

    closeModal() {
        this.setState({
            addModalOpen: false,
            orderModalOpen: false,
            editModalOpen: false,
            deleteModalOpen: false,
            restockModalOpen: false,
        });
    }

    requestItems() {
        this.setState({
            loaded: false
        });
        axios
        .get(this.config.restServer.url + '/Item', { withCredentials: true })
        .then(res => {
            const { data: items } = res;
            console.log(items);
            this.setState({
                items: items,
            });
        })
        .catch(err => {
            toast.error('Cannot load items: ' + err);
        })
        .finally(() => {
            this.setState({
                loaded: true
            });
        });
    }

    render() {
        const { loaded, items } = this.state;
        const { role } = this.props;
        return (
            <div>
                <h2>Items {role === Role.SELLER ? <Button variant="outline-dark" className="ml-2" size="sm" onClick={this.openAddModal}>Add</Button> : <></>}</h2>
                {!loaded ?
                    <FetchLoader /> :
                    <CardColumns className="mt-4">
                        {items.length > 0 ?
                            items.map((item, index) => (
                                <ItemCard key={index} item={item} role={role}
                                    orderItem={this.openOrderModal}
                                    editItem={this.openEditModal}
                                    deleteItem={this.openDeleteModal}
                                    restockItem={this.openRestockModal}
                                />
                            ))
                            : <p>No items available</p>
                        }
                    </CardColumns>
                }
                {
                    role === Role.SELLER ?
                        <>
                            <RestockModal onHide={this.closeModal} shown={this.state.restockModalOpen} item={this.state.itemForRestock} handleSuccess={this.requestItems} />
                            <AddModal onHide={this.closeModal} shown={this.state.addModalOpen} handleSuccess={this.requestItems}/>
                            <EditModal onHide={this.closeModal} shown={this.state.editModalOpen} item={this.state.itemForEdit} handleSuccess={this.requestItems} />
                            <DeleteModal onHide={this.closeModal} shown={this.state.deleteModalOpen} item={this.state.itemForDelete} handleSuccess={this.requestItems} />
                        </> :
                        <OrderModal onHide={this.closeModal} shown={this.state.orderModalOpen} item={this.state.itemForOrder} />
                }
            </div>
        )
    }
}

export default Items;