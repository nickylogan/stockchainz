import * as React from 'react';
import { Button, CardColumns } from 'react-bootstrap';

import FetchLoader from 'components/FetchLoader';
import OrderModal from 'components/OrderModal';
import AddModal from 'components/AddModal';
import EditModal from 'components/EditModal';
import DeleteModal from 'components/DeleteModal';
import RestockModal from 'components/RestockModal';
import ItemCard from './ItemCard';
import { Item, Seller, Buyer, Participant } from 'utils/types';
import InventoryModal from 'components/InventoryModal';

// const testItems = [
//     {
//         id: "I_1234-A",
//         name: "Item A",
//         description: "Item named A",
//         amount: 10,
//     },
//     {
//         id: "I_1234-B",
//         name: "Item B",
//         description: "Item named B",
//         amount: 3,
//     },
//     {
//         id: "I_1234-C",
//         name: "Item C",
//         description: "Item named C",
//         amount: 5,
//     },
// ];

interface Props {
  items: Array<Item>;
  loaded: boolean;
  user: Participant;
  refresh: () => void;
}

interface State {
  addModalOpen: boolean;
  orderModalOpen: boolean;
  editModalOpen: boolean;
  deleteModalOpen: boolean;
  restockModalOpen: boolean;
  inventoryModalOpen: boolean;
  itemForOrder: Item;
  itemForEdit: Item;
  itemForDelete: Item;
  itemForRestock: Item;
  itemForInventory: Item;
}

export default class Items extends React.Component<Props, State> {
  state: State;
  constructor(props: Props) {
    super(props);
    this.state = {
      addModalOpen: false,
      orderModalOpen: false,
      editModalOpen: false,
      deleteModalOpen: false,
      restockModalOpen: false,
      inventoryModalOpen: false,
      itemForOrder: new Item('', '', ''),
      itemForEdit: new Item('', '', ''),
      itemForDelete: new Item('', '', ''),
      itemForRestock: new Item('', '', ''),
      itemForInventory: new Item('', '', '')
    };

    this.openAddModal = this.openAddModal.bind(this);
    this.openOrderModal = this.openOrderModal.bind(this);
    this.openEditModal = this.openEditModal.bind(this);
    this.openDeleteModal = this.openDeleteModal.bind(this);
    this.openRestockModal = this.openRestockModal.bind(this);
    this.openInventoryModal = this.openInventoryModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  openAddModal() {
    this.setState({
      addModalOpen: true
    });
  }

  openOrderModal(item: Item) {
    this.setState({
      orderModalOpen: true,
      itemForOrder: item
    });
  }

  openEditModal(item: Item) {
    this.setState({
      editModalOpen: true,
      itemForEdit: item
    });
  }

  openDeleteModal(item: Item) {
    this.setState({
      deleteModalOpen: true,
      itemForDelete: item
    });
  }

  openRestockModal(item: Item) {
    this.setState({
      restockModalOpen: true,
      itemForRestock: item
    });
  }

  openInventoryModal(item: Item) {
    this.setState({
      inventoryModalOpen: true,
      itemForInventory: item
    });
  }

  closeModal() {
    this.setState({
      addModalOpen: false,
      orderModalOpen: false,
      editModalOpen: false,
      deleteModalOpen: false,
      restockModalOpen: false,
      inventoryModalOpen: false
    });
  }

  render() {
    const { loaded, items, user, refresh } = this.props;
    return (
      <div>
        <h2>
          Items{' '}
          {user && user.type === Seller.TYPE && (
            <Button variant="outline-dark" className="ml-2" size="sm" onClick={this.openAddModal}>
              Add
            </Button>
          )}
        </h2>
        {!loaded ? (
          <FetchLoader />
        ) : (
          <CardColumns className="mt-4">
            {items.length === 0 ? (
              <p>No items available</p>
            ) : (
              items.map((item: Item, index: string | number | undefined) => (
                <ItemCard
                  key={index}
                  item={item}
                  user={user}
                  orderItem={this.openOrderModal}
                  editItem={this.openEditModal}
                  deleteItem={this.openDeleteModal}
                  restockItem={this.openRestockModal}
                  checkInventory={this.openInventoryModal}
                />
              ))
            )}
          </CardColumns>
        )}
        {user && user.type === Seller.TYPE && (
          <>
            <RestockModal
              onHide={this.closeModal}
              shown={this.state.restockModalOpen}
              item={this.state.itemForRestock}
              handleSuccess={refresh}
            />
            <AddModal
              onHide={this.closeModal}
              shown={this.state.addModalOpen}
              handleSuccess={refresh}
            />
            <EditModal
              onHide={this.closeModal}
              shown={this.state.editModalOpen}
              item={this.state.itemForEdit}
              handleSuccess={refresh}
            />
            <DeleteModal
              onHide={this.closeModal}
              shown={this.state.deleteModalOpen}
              item={this.state.itemForDelete}
              handleSuccess={refresh}
            />
            <InventoryModal
              onHide={this.closeModal}
              shown={this.state.inventoryModalOpen}
              item={this.state.itemForInventory}
            />
          </>
        )}
        {user && user.type === Buyer.TYPE && (
          <OrderModal
            onHide={this.closeModal}
            shown={this.state.orderModalOpen}
            item={this.state.itemForOrder}
          />
        )}
      </div>
    );
  }
}
