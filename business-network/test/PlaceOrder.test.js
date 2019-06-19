'use strict';

const { AdminConnection } = require('composer-admin');
const { BusinessNetworkConnection, AssetRegistry } = require('composer-client');
const { BusinessNetworkDefinition, CertificateUtil, IdCard } = require('composer-common');
const { resolve } = require('path');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

const NS = 'com.stockchainz.net';
const NS_ITEM = NS + '.Item';
const NS_INV = NS + '.Inventory';
const NS_SALE = NS + '.Sale';
const NS_SELLER = NS + '.Seller';
const NS_BUYER = NS + '.Buyer';

const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore({ type: 'composer-wallet-inmemory' });

/** @type {AdminConnection} */
let adminConnection;
/** @type {BusinessNetworkConnection} */
let businessNetworkConnection;

/** @type {String} */
let adminCardName;
/** @type {String} */
let sellerCardName;
/** @type {String} */
let buyerCardName;

/**
 * @typedef {Object} Item
 * @property {String} name
 * @property {String} description
 * @property {number} amount
 * @property {*} seller
 */

/**
 * @typedef {Object} Inventory
 * @property {Object} item
 * @property {*[]} changes
 */

// Embedded connection used for local testing
const connectionProfile = {
    name: 'embedded',
    'x-type': 'embedded'
};

describe('(TC-23 - TC-28): PlaceOrder', () => {
    before(async () => {
        // Generate certificates for use with the embedded connection
        const credentials = CertificateUtil.generate({ commonName: 'admin' });

        // PeerAdmin identity used with the admin connection to deploy business networks
        const deployerMetadata = {
            version: 1,
            userName: 'PeerAdmin',
            roles: ['PeerAdmin', 'ChannelAdmin']
        };
        const deployerCard = new IdCard(deployerMetadata, connectionProfile);
        deployerCard.setCredentials(credentials);

        const deployerCardName = 'PeerAdmin';
        adminConnection = new AdminConnection({ cardStore: cardStore });

        await adminConnection.importCard(deployerCardName, deployerCard);
        await adminConnection.connect(deployerCardName);
    });

    beforeEach(async () => {
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });

        const adminUserName = 'admin';
        let businessNetworkDefinition = await BusinessNetworkDefinition.fromDirectory(resolve(__dirname, '..'));

        // Install the Composer runtime for the new business network
        await adminConnection.install(businessNetworkDefinition);

        // Start the business network and configure an network admin identity
        const startOptions = {
            networkAdmins: [
                {
                    userName: adminUserName,
                    enrollmentSecret: 'adminpw'
                }
            ]
        };
        const adminCards = await adminConnection.start(businessNetworkDefinition.getName(), businessNetworkDefinition.getVersion(), startOptions);

        // Import the network admin identity for us to use
        adminCardName = `${adminUserName}@${businessNetworkDefinition.getName()}`;
        await adminConnection.importCard(adminCardName, adminCards.get(adminUserName));

        // Connect to the business network using the network admin identity
        await businessNetworkConnection.connect(adminCardName);

        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        // Participant metadata
        const participantMetadata = {
            userName: '',
            version: 1,
            enrollmentSecret: '',
            businessNetwork: businessNetworkDefinition.getName(),
        };

        // Create new seller participant (owner)
        const sellerUserName = 'test-seller-owner';
        const seller = factory.newResource(NS, 'Seller', sellerUserName);
        seller.name = 'Seller Owner';

        // Add seller to registry
        const sellerRegistry = await businessNetworkConnection.getParticipantRegistry(NS_SELLER);
        await sellerRegistry.addAll([seller]);

        // Issue identity for seller owner
        const sellerIdentity = await businessNetworkConnection.issueIdentity(NS_SELLER + `#${sellerUserName}`, sellerUserName);
        participantMetadata.userName = sellerIdentity.userID;
        participantMetadata.enrollmentSecret = sellerIdentity.userSecret;

        const sellerCard = new IdCard(participantMetadata, connectionProfile);
        sellerCardName = `${sellerUserName}@${businessNetworkDefinition.getName()}`;
        await adminConnection.importCard(sellerCardName, sellerCard);

        // Create new buyer participant
        const buyerUserName = 'test-buyer';
        const buyer = factory.newResource(NS, 'Buyer', buyerUserName);
        buyer.name = 'Test Buyer';

        const buyerRegistry = await businessNetworkConnection.getParticipantRegistry(NS_BUYER);
        await buyerRegistry.add(buyer);

        const buyerIdentity = await businessNetworkConnection.issueIdentity(NS_BUYER + `#${buyerUserName}`, buyerUserName);
        participantMetadata.userName = buyerIdentity.userID;
        participantMetadata.enrollmentSecret = buyerIdentity.userSecret;
        const buyerCard = new IdCard(participantMetadata, connectionProfile);
        buyerCardName = `${buyerUserName}@${businessNetworkDefinition.getName()}`;
        await adminConnection.importCard(buyerCardName, buyerCard);

        // Create an item first
        await businessNetworkConnection.connect(sellerCardName);
        // Create transaction
        const createItem = factory.newTransaction(NS, 'CreateItem');
        createItem.itemID = 'IT_1234';
        createItem.name = 'Test Item';
        createItem.description = 'Test Description';

        // Submit transaction
        await businessNetworkConnection.submitTransaction(createItem);

        // Create transaction
        const restockItem = factory.newTransaction(NS, 'RestockItem');
        restockItem.item = factory.newRelationship(NS, 'Item', 'IT_1234');
        restockItem.amount = 5;

        await businessNetworkConnection.submitTransaction(restockItem);
    });

    it('(TC-23) should allow a buyer to order an item', async () => {
        await businessNetworkConnection.connect(buyerCardName);

        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        // Create transaction
        const placeOrder = factory.newTransaction(NS, 'PlaceOrder');
        placeOrder.item = factory.newRelationship(NS, 'Item', 'IT_1234');
        placeOrder.amount = 2;

        await businessNetworkConnection.submitTransaction(placeOrder);

        const query = businessNetworkConnection.buildQuery(`SELECT ${NS_SALE} WHERE (item == _$item)`);
        const sales = await businessNetworkConnection.query(query, { item: `resource:${NS_ITEM}#IT_1234` });
        sales.should.not.be.empty;

        const sale = sales[0];
        sale.should.have.property('amount', 2);
        sale.should.have.property('status', 'UNCONFIRMED');
        sale.item.getIdentifier().should.equal('IT_1234');
    });

    it('(TC-24) should not allow a non-buyer to order an item', async () => {
        await businessNetworkConnection.connect(sellerCardName);
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        // Create transaction
        const placeOrder = factory.newTransaction(NS, 'PlaceOrder');
        placeOrder.item = factory.newRelationship(NS, 'Item', 'IT_1234');
        placeOrder.amount = 2;

        return businessNetworkConnection.submitTransaction(placeOrder).should.be.rejected;
    });

    it('(TC-25) should not allow ordering a non-existent item', async () => {
        await businessNetworkConnection.connect(buyerCardName);
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        // Create transaction
        const placeOrder = factory.newTransaction(NS, 'PlaceOrder');
        placeOrder.item = factory.newRelationship(NS, 'Item', 'ITEM_9999');
        placeOrder.amount = 2;

        return businessNetworkConnection.submitTransaction(placeOrder).should.be.rejected;
    });
    
    it('(TC-26) should not allow an order with negative amount', async () => {
        await businessNetworkConnection.connect(buyerCardName);
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        // Create transaction
        const placeOrder = factory.newTransaction(NS, 'PlaceOrder');
        placeOrder.item = factory.newRelationship(NS, 'Item', 'IT_1234');
        placeOrder.amount = -1;

        return businessNetworkConnection.submitTransaction(placeOrder).should.be.rejected;
    });
    
    it('(TC-27) should not allow an order with a zero amount', async () => {
        await businessNetworkConnection.connect(buyerCardName);
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();
        
        // Create transaction
        const placeOrder = factory.newTransaction(NS, 'PlaceOrder');
        placeOrder.item = factory.newRelationship(NS, 'Item', 'IT_1234');
        placeOrder.amount = 0;
        
        return businessNetworkConnection.submitTransaction(placeOrder).should.be.rejected;
    });

    it('(TC-28) should not allow an order if the item in stock isn\'t enough', async () => {
        await businessNetworkConnection.connect(buyerCardName);
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        // Create transaction
        const placeOrder = factory.newTransaction(NS, 'PlaceOrder');
        placeOrder.item = factory.newRelationship(NS, 'Item', 'IT_1234');
        placeOrder.amount = 1000;

        return businessNetworkConnection.submitTransaction(placeOrder).should.be.rejected;
    });
});