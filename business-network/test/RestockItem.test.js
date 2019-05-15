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

describe('RestockItem', () => {
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

        // Create an item first
        await businessNetworkConnection.connect(ownerSellerCardName);
        // Create transaction
        const createItem = factory.newTransaction(NS, 'CreateItem');
        createItem.itemID = 'ITEM_1234';
        createItem.name = 'Test Item';
        createItem.description = 'Test Description';

        // Submit transaction
        await businessNetworkConnection.submitTransaction(createItem);
    });

    it('should allow a seller to restock an item', async () => {
        await businessNetworkConnection.connect(ownerSellerCardName);

        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        // Create transaction
        const restockItem = factory.newTransaction(NS, 'RestockItem');
        restockItem.item = factory.newRelationship(NS, 'Item', 'ITEM_1234');
        restockItem.amount = 5;

        for (let i = 1; i <= 3; ++i) {
            // Submit transaction
            await businessNetworkConnection.submitTransaction(restockItem);

            // Check contents
            const itemRegistry = await businessNetworkConnection.getAssetRegistry(NS_ITEM);

            /** @type {Item} */
            const item = await itemRegistry.get('ITEM_1234');
            item.amount.should.equal(i * 5);

            /** @type {Inventory[]} */
            const invs = await businessNetworkConnection.query('queryInventory', { item: `resource:${item.getFullyQualifiedIdentifier()}` });
            const inv = invs[0];
            inv.changes.should.have.length(i);
            inv.changes[i - 1].type.should.equal("RESTOCK");
            inv.changes[i - 1].amount.should.equal(5);
        }
    });

    it('should not allow a non-seller to restock an item', async () => {
        await businessNetworkConnection.connect(buyerCardName);
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        const restockItem = factory.newTransaction(NS, 'RestockItem');
        restockItem.item = factory.newRelationship(NS, 'Item', 'ITEM_1234');
        restockItem.amount = 5;

        return businessNetworkConnection.submitTransaction(restockItem).should.be.rejected;
    });

    it('should not allow a seller to restock another seller\'s item', async () => {
        await businessNetworkConnection.connect(otherSellerCardName);
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        const restockItem = factory.newTransaction(NS, 'RestockItem');
        restockItem.item = factory.newRelationship(NS, 'Item', 'ITEM_1234');
        restockItem.amount = 5;

        return businessNetworkConnection.submitTransaction(restockItem).should.be.rejected;
    });

    it('should not allow restocking a non-existent item', async () => {
        await businessNetworkConnection.connect(ownerSellerCardName);
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        const restockItem = factory.newTransaction(NS, 'RestockItem');
        restockItem.item = factory.newRelationship(NS, 'Item', 'ITEM_9999');
        restockItem.amount = 5;

        return businessNetworkConnection.submitTransaction(restockItem).should.be.rejected;
    });

    it('should not allow negative restock', async () => {
        await businessNetworkConnection.connect(ownerSellerCardName);
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        const restockItem = factory.newTransaction(NS, 'RestockItem');
        restockItem.item = factory.newRelationship(NS, 'Item', 'ITEM_1234');
        restockItem.amount = -1;

        return businessNetworkConnection.submitTransaction(restockItem).should.be.rejected;
    });

    it('should not allow zero restock', async () => {
        await businessNetworkConnection.connect(ownerSellerCardName);
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        const restockItem = factory.newTransaction(NS, 'RestockItem');
        restockItem.item = factory.newRelationship(NS, 'Item', 'ITEM_1234');
        restockItem.amount = 0;

        return businessNetworkConnection.submitTransaction(restockItem).should.be.rejected;
    });
});