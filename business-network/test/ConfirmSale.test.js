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
let ownerSellerCardName;
/** @type {String} */
let otherSellerCardName;
/** @type {String} */
let buyerCardName;
/** @type {String} */
let saleID;

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

describe('(TC-29 - TC-34) ConfirmSale', () => {
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

        // Create new seller participant (other)
        const otherSellerUserName = 'test-seller-other';
        const otherSeller = factory.newResource(NS, 'Seller', otherSellerUserName);
        otherSeller.name = 'Other Seller';

        // Add both sellers to registry
        const sellerRegistry = await businessNetworkConnection.getParticipantRegistry(NS_SELLER);
        await sellerRegistry.addAll([seller, otherSeller]);

        // Issue identity for seller owner
        const sellerIdentity = await businessNetworkConnection.issueIdentity(NS_SELLER + `#${sellerUserName}`, sellerUserName);
        participantMetadata.userName = sellerIdentity.userID;
        participantMetadata.enrollmentSecret = sellerIdentity.userSecret;

        const sellerCard = new IdCard(participantMetadata, connectionProfile);
        ownerSellerCardName = `${sellerUserName}@${businessNetworkDefinition.getName()}`;
        await adminConnection.importCard(ownerSellerCardName, sellerCard);

        // Issue identity for the other seller
        const otherSellerIdentity = await businessNetworkConnection.issueIdentity(NS_SELLER + `#${otherSellerUserName}`, otherSellerUserName);
        participantMetadata.userName = otherSellerIdentity.userID;
        participantMetadata.enrollmentSecret = otherSellerIdentity.userSecret;

        const otherSellerCard = new IdCard(participantMetadata, connectionProfile);
        otherSellerCardName = `${otherSellerUserName}@${businessNetworkDefinition.getName()}`;
        await adminConnection.importCard(otherSellerCardName, otherSellerCard);

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

        await businessNetworkConnection.connect(ownerSellerCardName);

        // 1. Create an item first
        const createItem = factory.newTransaction(NS, 'CreateItem');
        createItem.itemID = 'IT_1234';
        createItem.name = 'Test Item';
        createItem.description = 'Test Description';
        await businessNetworkConnection.submitTransaction(createItem);

        // 2. Restock the item
        const restockItem = factory.newTransaction(NS, 'RestockItem');
        restockItem.item = factory.newRelationship(NS, 'Item', 'IT_1234');
        restockItem.amount = 5;
        await businessNetworkConnection.submitTransaction(restockItem);

        // 3. Have a buyer order the item
        await businessNetworkConnection.connect(buyerCardName);
        const placeOrder = factory.newTransaction(NS, 'PlaceOrder');
        placeOrder.item = factory.newRelationship(NS, 'Item', 'IT_1234');
        placeOrder.amount = 2;
        await businessNetworkConnection.submitTransaction(placeOrder);

        const query = businessNetworkConnection.buildQuery(`SELECT ${NS_SALE} WHERE (item == _$item)`);
        const sales = await businessNetworkConnection.query(query, { item: `resource:${NS_ITEM}#IT_1234` });
        saleID = sales[0].getIdentifier();
    });

    it('(TC-29) should allow a seller to confirm a sale', async () => {
        await businessNetworkConnection.connect(ownerSellerCardName);

        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        const saleConfirmation = factory.newTransaction(NS, 'ConfirmSale');
        saleConfirmation.sale = factory.newRelationship(NS, 'Sale', saleID);

        await businessNetworkConnection.submitTransaction(saleConfirmation);

        const saleRegistry = await businessNetworkConnection.getAssetRegistry(NS_SALE);
        const itemRegistry = await businessNetworkConnection.getAssetRegistry(NS_ITEM);

        /** @type {Item} */
        const item = await itemRegistry.get('IT_1234');

        /** @type {Inventory[]} */
        const invs = await businessNetworkConnection.query('queryInventory', { item: `resource:${item.getFullyQualifiedIdentifier()}` });
        const inv = invs[0];

        const sale = await saleRegistry.get(saleID);

        sale.status.should.equal("CONFIRMED");
        item.amount.should.equal(3);
        inv.changes.should.have.length(2);
        inv.changes[1].type.should.equal("SALE");
        inv.changes[1].amount.should.equal(-2);
    });

    it('(TC-30) should not allow a non-seller to confirm a sale', async () => {
        await businessNetworkConnection.connect(buyerCardName);
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        const saleConfirmation = factory.newTransaction(NS, 'ConfirmSale');
        saleConfirmation.sale = factory.newRelationship(NS, 'Sale', saleID);

        return businessNetworkConnection.submitTransaction(saleConfirmation).should.be.rejected;
    });

    it('(TC-31) should not allow a seller to confirm another seller\'s sale', async () => {
        await businessNetworkConnection.connect(otherSellerCardName);
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        const saleConfirmation = factory.newTransaction(NS, 'ConfirmSale');
        saleConfirmation.sale = factory.newRelationship(NS, 'Sale', saleID);

        return businessNetworkConnection.submitTransaction(saleConfirmation).should.be.rejected;
    });

    it('(TC-32) should not allow confirming a non-existent sale', async () => {
        await businessNetworkConnection.connect(ownerSellerCardName);
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        const saleConfirmation = factory.newTransaction(NS, 'ConfirmSale');
        saleConfirmation.sale = factory.newRelationship(NS, 'Sale', 'SALE_XXXX');

        return businessNetworkConnection.submitTransaction(saleConfirmation).should.be.rejected;
    });

    it('(TC-33) should not allow confirming an already confirmed sale', async () => {
        await businessNetworkConnection.connect(ownerSellerCardName);

        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        const saleConfirmation = factory.newTransaction(NS, 'ConfirmSale');
        saleConfirmation.sale = factory.newRelationship(NS, 'Sale', saleID);

        await businessNetworkConnection.submitTransaction(saleConfirmation);
        return businessNetworkConnection.submitTransaction(saleConfirmation).should.be.rejected;
    });

    it('(TC-34) should not allow confirming a sale if the item in stock is not enough', async () => {
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        // Have a buyer order the item (sale not confirmed yet)
        await businessNetworkConnection.connect(buyerCardName);
        const placeOrder = factory.newTransaction(NS, 'PlaceOrder');
        placeOrder.item = factory.newRelationship(NS, 'Item', 'IT_1234');
        placeOrder.amount = 5;
        await businessNetworkConnection.submitTransaction(placeOrder);

        // Change to seller
        await businessNetworkConnection.connect(ownerSellerCardName);
        const saleConfirmation = factory.newTransaction(NS, 'ConfirmSale');
        saleConfirmation.sale = factory.newRelationship(NS, 'Sale', saleID);
        await businessNetworkConnection.submitTransaction(saleConfirmation);

        // Get unconfirmed sale
        const query = businessNetworkConnection.buildQuery(`SELECT ${NS_SALE} WHERE (item == _$item AND status == 'UNCONFIRMED')`);
        const sales = await businessNetworkConnection.query(query, { item: `resource:${NS_ITEM}#IT_1234` });
        const otherSaleID = sales[0].getIdentifier();

        const otherSaleConfirmation = factory.newTransaction(NS, 'ConfirmSale');
        otherSaleConfirmation.sale = factory.newRelationship(NS, 'Sale', otherSaleID);

        return businessNetworkConnection.submitTransaction(otherSaleConfirmation).should.be.rejected;
    });
});