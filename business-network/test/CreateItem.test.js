'use strict';

const { AdminConnection } = require('composer-admin');
const { BusinessNetworkConnection, AssetRegistry } = require('composer-client');
const { BusinessNetworkDefinition, CertificateUtil, IdCard } = require('composer-common');
const { resolve } = require('path');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const should = chai.should();

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

describe('(TC-7 - TC-11): CreateItem', () => {
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

        // Create new seller participant
        const sellerUserName = 'test-seller1';
        const seller = factory.newResource(NS, 'Seller', sellerUserName);
        seller.name = 'Test Seller';

        const sellerRegistry = await businessNetworkConnection.getParticipantRegistry(NS_SELLER);
        await sellerRegistry.add(seller);

        const sellerIdentity = await businessNetworkConnection.issueIdentity(NS_SELLER + `#${sellerUserName}`, sellerUserName);
        const sellerMetadata = {
            userName: sellerIdentity.userID,
            version: 1,
            enrollmentSecret: sellerIdentity.userSecret,
            businessNetwork: businessNetworkDefinition.getName(),
        };
        const sellerCard = new IdCard(sellerMetadata, connectionProfile);
        sellerCardName = `${sellerUserName}@${businessNetworkDefinition.getName()}`;
        await adminConnection.importCard(sellerCardName, sellerCard);

        // Create new buyer participant
        const buyerUserName = 'test-buyer';
        const buyer = factory.newResource(NS, 'Buyer', buyerUserName);
        buyer.name = 'Test Buyer';

        const buyerRegistry = await businessNetworkConnection.getParticipantRegistry(NS_BUYER);
        await buyerRegistry.add(buyer);

        const buyerIdentity = await businessNetworkConnection.issueIdentity(NS_BUYER + `#${buyerUserName}`, buyerUserName);
        const buyerMetadata = {
            userName: buyerIdentity.userID,
            version: 1,
            enrollmentSecret: buyerIdentity.userSecret,
            businessNetwork: businessNetworkDefinition.getName(),
        }
        const buyerCard = new IdCard(buyerMetadata, connectionProfile);
        buyerCardName = `${buyerUserName}@${businessNetworkDefinition.getName()}`;
        await adminConnection.importCard(buyerCardName, buyerCard);
    });

    it('(TC-7) should allow a seller to create an item', async () => {
        await businessNetworkConnection.connect(sellerCardName);

        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        // Create transaction
        const createItem = factory.newTransaction(NS, 'CreateItem');
        createItem.itemID = 'IT_1234';
        createItem.name = 'Test Item';
        createItem.description = 'Test Description';

        // Submit transaction
        await businessNetworkConnection.submitTransaction(createItem);

        // Check contents
        const itemRegistry = await businessNetworkConnection.getAssetRegistry(NS_ITEM);
        const invRegistry = await businessNetworkConnection.getAssetRegistry(NS_INV);
        
        const item = await itemRegistry.get('IT_1234');
        should.exist(item);
        item.should.have.property('name', 'Test Item');
        item.should.have.property('description', 'Test Description');
        item.should.have.property('amount', 0);
        item.should.have.property('seller');
        item.seller.getIdentifier().should.equal('test-seller1');

        const inv = await invRegistry.get('INV_IT_1234');
        should.exist(inv);
        inv.should.have.property('item');
        inv.item.getIdentifier().should.equal('IT_1234');
        inv.should.have.property('changes');
        inv.changes.should.have.length(0);
    });

    it('(TC-8) should not allow creating a duplicate item', async () => {
        await businessNetworkConnection.connect(sellerCardName);

        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        // Create transaction
        const createItem = factory.newTransaction(NS, 'CreateItem');
        createItem.itemID = 'IT_1234';
        createItem.name = 'Test Item';
        createItem.description = 'Test Description';

        // Submit transaction
        await businessNetworkConnection.submitTransaction(createItem);

        return businessNetworkConnection.submitTransaction(createItem).should.be.rejected;
    });

    
    it('(TC-9) should not allow creating a no-id item', async () => {
        await businessNetworkConnection.connect(sellerCardName);

        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();
        
        // Create transaction
        const createItem = factory.newTransaction(NS, 'CreateItem');
        createItem.itemID = '';
        createItem.name = 'Test item';
        
        // Submit transaction
        return businessNetworkConnection.submitTransaction(createItem).should.be.rejected;
    });

    it('(TC-10) should not allow creating a no-name item', async () => {
        await businessNetworkConnection.connect(sellerCardName);
        
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();
        
        // Create transaction
        const createItem = factory.newTransaction(NS, 'CreateItem');
        createItem.itemID = 'IT_1234';
        createItem.name = '';
        
        // Submit transaction
        return businessNetworkConnection.submitTransaction(createItem).should.be.rejected;
    });

    it('(TC-11) should not allow a non-seller to create an item', async () => {
        await businessNetworkConnection.connect(buyerCardName);
        const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        const createItem = factory.newTransaction(NS, 'CreateItem');
        createItem.itemID = 'IT_1234';
        createItem.name = 'Test item';
        createItem.description = 'Test Description';

        return businessNetworkConnection.submitTransaction(createItem).should.be.rejected;
    });
});