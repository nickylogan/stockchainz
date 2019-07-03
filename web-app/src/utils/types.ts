import Config from './config';
import Axios, { AxiosError } from 'axios';
import uuid from 'uuidv4';
import crypto from 'crypto';
import * as _ from 'underscore.string';

const config: Config = new Config();

export interface Session {
  loggedIn: boolean;
  user?: Participant;
}

export abstract class Model {
  type: string;
  id: string;
  static NS = 'com.stockchainz.net';

  constructor(type: string, id: string) {
    this.type = type;
    this.id = id;
  }

  static getNamespaced(model: string) {
    return `${Model.NS}.${model}`;
  }

  getNamespacedType(): string {
    return Model.getNamespaced(this.type);
  }

  getFullyQualifiedIdentifier(): string {
    return `${this.getNamespacedType()}#${this.id}`;
  }

  getResourceLocator(): string {
    return `resource:${this.getFullyQualifiedIdentifier()}`;
  }

  static split(locator: string): [string, string] {
    const [$class, id] = locator.split('#');
    const namespace = $class.split('.');
    return [namespace[namespace.length - 1], id];
  }
}

export class Participant extends Model {
  name: string;

  constructor(role: string, id: string, name: string) {
    super(role, id);
    this.name = name;
  }

  static requestSession(): Promise<Session> {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await Axios.get(`${config.restServer.url}/wallet`, {
          withCredentials: true
        });
        let participant = undefined;
        if (data.length > 0) {
          // Check bound participant
          let response = await Axios.get(`${config.restServer.url}/system/ping`, {
            withCredentials: true
          });
          const [role, id] = Model.split(response.data.participant);

          // Get details for bound participant
          response = await Axios.get(`${config.restServer.url}/${role}/${id}`, {
            withCredentials: true
          });
          participant = new Participant(role, id, response.data.name);
        }
        resolve({ loggedIn: true, user: participant });
      } catch (err) {
        if (err.response && err.response.status === 401) {
          resolve({ loggedIn: false });
        } else {
          reject(err);
        }
      }
    });
  }

  static requestRegister(name: string, role: string): Promise<Participant> {
    const userID = crypto
      .createHash('sha1')
      .update(name)
      .update(role)
      .digest('hex');

    const participant = new Participant(role, userID, name);

    return new Promise(async (resolve, reject) => {
      try {
        // 1. Check if participant exists
        const response = await Axios.get(`${config.accountServer.url}/${role}`);
        const accountExists = response.data.some(
          (participant: { name: string }) => participant.name === name
        );

        let shouldIssueIdentity = true;

        if (accountExists) {
          // If participant exists, check if identity is already issued
          const response = await Axios.get(`${config.accountServer.url}/system/identities`);
          const [adminIdentity] = response.data.filter(
            (identity: { participant: string }) =>
              identity.participant ===
              `resource:org.hyperledger.composer.system.NetworkAdmin#admin${config.market.id}`
          );
          const [identity] = response.data.filter(
            (identity: { issuer: string; participant: string }) => {
              return (
                identity.participant === participant.getResourceLocator() &&
                identity.issuer === adminIdentity.issuer
              );
            }
          );
          // Identity should only be issued if the identity does not exist
          // for this connection
          shouldIssueIdentity = !identity;
        } else {
          // Otherwise, create participant
          await Axios.post(`${config.accountServer.url}/${participant.type}`, {
            $class: participant.getNamespacedType(),
            [role.toLowerCase() + 'ID']: userID,
            name: name
          });
        }

        if (!shouldIssueIdentity) {
          throw new Error('Account already exists!');
        }

        const identityIssueData = {
          participant: participant.getFullyQualifiedIdentifier(),
          userID: userID,
          options: {}
        };
        const { data: cardData } = await Axios.post(
          `${config.accountServer.url}/system/identities/issue`,
          identityIssueData,
          { responseType: 'blob' }
        );
        const cardFile = new File([cardData], `${userID}.card`, {
          type: 'application/octet-stream',
          lastModified: Date.now()
        });
        const walletData = new FormData();
        walletData.append('card', cardFile);
        await Axios.post(`${config.restServer.url}/wallet/import`, walletData, {
          withCredentials: true,
          headers: { 'content-type': 'multipart/form-data' }
        });

        resolve(participant);
      } catch (err) {
        reject(err);
      }
    });
  }

  static requestSignout() {
    return Axios.get(`${config.restServer.authURL}/logout`, { withCredentials: true });
  }
}

export class Seller extends Participant {
  static TYPE = 'Seller';
  static cache: any = {};

  constructor(id: string, name: string) {
    super(Seller.TYPE, id, name);
  }

  static requestData(id: string): Promise<Seller> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!Seller.cache[id]) {
          const response = await Axios.get(config.restServer.url + '/Seller/' + id, {
            withCredentials: true
          });
          Seller.cache[id] = new Seller(id, response.data.name);
        }
        resolve(Seller.cache[id]);
      } catch (err) {
        reject(err);
      }
    });
  }
}

export class Buyer extends Participant {
  static TYPE = 'Buyer';

  constructor(id: string, name: string) {
    super(Buyer.TYPE, id, name);
  }
}

export class Item extends Model {
  static TYPE = 'Item';

  name: string;
  description: string;
  amount: number;
  seller: Seller | undefined;
  static cache: any = {};

  constructor(id: string, name: string, description: string, seller?: Seller, amount: number = 0) {
    super(Item.TYPE, id);
    this.name = name;
    this.description = description;
    this.amount = amount;
    this.seller = seller;
  }

  static requestCreate(name: string, description: string): Promise<Item> {
    const itemID = 'IT_' + uuid();
    return new Promise(async (resolve, reject) => {
      try {
        await Axios.post(
          config.restServer.url + '/CreateItem',
          {
            $class: Model.getNamespaced('CreateItem'),
            itemID: 'IT_' + uuid(),
            name: name,
            description: description,
            transactionId: '',
            timestamp: new Date().toISOString()
          },
          { withCredentials: true }
        );
        resolve(new Item(itemID, name, description));
      } catch (err) {
        reject(err);
      }
    });
  }

  static requestEdit(item: Item, newDescription: string) {
    return Axios.post(
      config.restServer.url + '/UpdateItem',
      {
        $class: Model.getNamespaced('UpdateItem'),
        item: item.id,
        newDescription: newDescription,
        transactionId: '',
        timestamp: new Date().toISOString()
      },
      { withCredentials: true }
    );
  }

  static requestDelete(item: Item) {
    return Axios.post(
      config.restServer.url + '/DeleteItem',
      {
        $class: Model.getNamespaced('DeleteItem'),
        item: item.getResourceLocator(),
        transactionId: '',
        timestamp: new Date().toISOString()
      },
      {
        withCredentials: true
      }
    );
  }

  static requestRestock(item: Item, amount: number) {
    return Axios.post(
      config.restServer.url + '/RestockItem',
      {
        $class: Model.getNamespaced('RestockItem'),
        item: item.getResourceLocator(),
        amount: amount,
        transactionId: '',
        timestamp: new Date().toISOString()
      },
      { withCredentials: true }
    );
  }

  static mapToItem(item: {
    seller: string;
    itemID: string;
    name: string;
    description: string;
    amount: number | undefined;
  }): Promise<Item> {
    return new Promise(async (resolve, reject) => {
      try {
        const [, id] = Model.split(item.seller);
        const seller = await Seller.requestData(id);
        resolve(new Item(item.itemID, item.name, item.description, seller, item.amount));
      } catch (err) {
        reject(err);
      }
    });
  }

  static requestFetchAll(): Promise<Array<Item>> {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await Axios.get(config.restServer.url + '/Item', {
          withCredentials: true
        });
        const items: Array<Item> = await Promise.all(
          data.map(
            async (itemData: {
              seller: string;
              itemID: string;
              name: string;
              description: string;
              amount: number | undefined;
            }) => await Item.mapToItem(itemData)
          )
        );

        resolve(items);
      } catch (err) {
        reject(err);
      }
    });
  }

  static requestData(id: string): Promise<Item> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!Item.cache[id]) {
          const { data } = await Axios.get(config.restServer.url + '/Item/' + id, {
            withCredentials: true
          });
          const [, sellerID] = Model.split(data.seller);
          const seller = await Seller.requestData(sellerID);

          Item.cache[id] = new Item(data.itemID, data.name, data.description, seller, data.amount);
        }
        resolve(Item.cache[id]);
      } catch (err) {
        reject(err);
      }
    });
  }
}

export enum DeltaType {
  RESTOCK = 'RESTOCK',
  SALE = 'SALE'
}

export interface InventoryDelta extends Model {
  amount: number;
  type: DeltaType;
}

export class Inventory extends Model {
  static TYPE = 'Inventory';
  itemID: string;
  changes: InventoryDelta[];

  constructor(id: string, itemID: string, changes: Array<InventoryDelta>) {
    super(Inventory.TYPE, id);
    this.itemID = itemID;
    this.changes = changes;
  }

  static requestOfItem(item: Item): Promise<Inventory> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await Axios.get(config.restServer.url + '/queries/queryInventory', {
          params: {
            item: item.getResourceLocator()
          },
          withCredentials: true
        });
        const invData = response.data[0];
        const changes: Array<InventoryDelta> = invData.changes.map(
          (delta: { amount: number; type: string }) => ({ amount: delta.amount, type: delta.type })
        );
        const [, itemID] = Model.split(invData.item);
        resolve(new Inventory(invData.invID, itemID, changes));
      } catch (err) {
        reject(err);
      }
    });
  }
}

export class Sale extends Model {
  static TYPE = 'Sale';

  item: Item;
  amount: number;
  confirmed: boolean;
  buyer?: Buyer;

  constructor(id: string, item: Item, amount: number, buyer?: Buyer, confirmed: boolean = false) {
    super(Sale.TYPE, id);

    this.item = item;
    this.amount = amount;
    this.buyer = buyer;
    this.confirmed = confirmed;
  }

  static requestCreate(item: Item, amount: number) {
    return Axios.post(
      config.restServer.url + '/PlaceOrder',
      {
        $class: Model.getNamespaced('PlaceOrder'),
        item: item.getResourceLocator(),
        amount: amount,
        transactionId: '',
        timestamp: new Date().toISOString()
      },
      { withCredentials: true }
    );
  }

  static requestConfirm(sale: Sale) {
    return Axios.post(
      config.restServer.url + '/ConfirmSale',
      {
        $class: Model.getNamespaced('ConfirmSale'),
        sale: sale.getResourceLocator(),
        transactionId: '',
        timestamp: new Date().toISOString()
      },
      { withCredentials: true }
    );
  }

  static mapToSale(sale: {
    item: string;
    buyer: string;
    saleID: string;
    amount: number;
    status: string;
  }): Promise<Sale> {
    return new Promise(async (resolve, reject) => {
      try {
        const [, itemID] = Model.split(sale.item);
        const [, buyerID] = Model.split(sale.buyer);
        const buyer = new Buyer(buyerID, '');
        try {
          const item = await Item.requestData(itemID);
          resolve(new Sale(sale.saleID, item, sale.amount, buyer, sale.status === 'CONFIRMED'));
        } catch (err) {
          if (err.response.status === 404) {
            console.log(err.response);
            const item = new Item('', '', '');
            resolve(new Sale(sale.saleID, item, sale.amount, buyer, sale.status === 'CONFIRMED'));
          } else {
            throw err;
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  static requestFetchAll(): Promise<Array<Sale>> {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await Axios.get(config.restServer.url + '/Sale', {
          withCredentials: true
        });
        const sales: Array<Sale> = await Promise.all(
          data.map(
            async (sale: {
              item: string;
              buyer: string;
              saleID: string;
              amount: number;
              status: string;
            }) => await this.mapToSale(sale)
          )
        );

        resolve(sales.filter(sale => sale.item.id !== ''));
      } catch (err) {
        reject(err);
      }
    });
  }
}

export class RequestError {
  static parseError(err: AxiosError): string {
    if (err.response) {
      let message: string = err.response.data.error.message;
      if (message.indexOf('AccessException') !== -1) {
        return 'Unallowed access';
      }
      message = message.split('\n')[1] || message;
      message = message.slice(message.lastIndexOf('Error'));
      message = message.slice(message.lastIndexOf(':'));
      message = _.trim(message);
      return message;
    } else {
      return err.message;
    }
  }
}
