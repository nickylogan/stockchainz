// import libraries
const request = require('supertest');
const uuid = require('uuidv4');
const fs = require('fs').promises;

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const Config = require('./utils/config');
const config = new Config();

// setup request agents
const restAgents = config.restServer.map(s => request(s.url));
const accountAgents = config.accountServer.map(s => request(s.url));

describe('Register test-seller1', () => {
    let cardFiles = [];

    it('creates participant test-seller1', async () => {
        const sellerID = 'test-seller1';
        const sellerName = 'Test Seller';

        const postData = {
            $class: 'com.stockchainz.net.Seller',
            sellerID: sellerID,
            name: sellerName,
        }
        const response = await accountAgents[0].post('/api/Seller')
            .send(postData);
        expect(response).to.have.status(200);
    });

    it('issues an identity for test-seller1 for each account server', async () => {
        const identity = {
            participant: 'com.stockchainz.net.Seller#test-seller1',
            userID: uuid(),
            options: {},
        };

        for (let i = 0; i < 3; ++i) {
            const response = await accountAgents[i].post('/api/system/identities/issue')
                .send(identity);
            expect(response).to.have.status(200);

            cardFiles[i] = response.body;
        }
    });

    it('imports the business network card of test-seller1 for each rest server', async () => {
        for (let i = 0; i < 3; ++i) {
            await fs.writeFile('test-seller1.card', cardFiles[i]);

            const response = await restAgents[i].post('/api/wallet/import')
                .set('X-Access-Token', config.accessTokens.sellers[0][i])
                .set('Content-type', 'multipart/form-data')
                .attach('card', './test-seller1.card', { contentType: 'application/octet-stream' });
            expect(response).to.have.status(204);
        }
    });
});

describe('Register test-seller2', () => {
    let cardFiles = [];

    it('creates participant test-seller2', async () => {
        const sellerID = 'test-seller2';
        const sellerName = 'Test Seller';

        const postData = {
            $class: 'com.stockchainz.net.Seller',
            sellerID: sellerID,
            name: sellerName,
        }
        const response = await accountAgents[0].post('/api/Seller')
            .send(postData);
        expect(response).to.have.status(200);
    });

    it('issues an identity for test-seller2 for each account server', async () => {
        const identity = {
            participant: 'com.stockchainz.net.Seller#test-seller2',
            userID: uuid(),
            options: {},
        };

        for (let i = 0; i < 3; ++i) {
            const response = await accountAgents[i].post('/api/system/identities/issue')
                .send(identity);
            expect(response).to.have.status(200);

            cardFiles[i] = response.body;
        }
    });

    it('imports the business network card of test-seller2 for each rest server', async () => {
        for (let i = 0; i < 3; ++i) {
            await fs.writeFile('test-seller2.card', cardFiles[i]);

            const response = await restAgents[i].post('/api/wallet/import')
                .set('X-Access-Token', config.accessTokens.sellers[1][i])
                .set('Content-type', 'multipart/form-data')
                .attach('card', './test-seller2.card', { contentType: 'application/octet-stream' });
            expect(response).to.have.status(204);
        }
    });
});

describe('Register test-buyer1', () => {
    let cardFiles = [];

    it('creates participant test-buyer1', async () => {
        const buyerID = 'test-buyer1';
        const buyerName = 'Test Buyer';

        const postData = {
            $class: 'com.stockchainz.net.Buyer',
            buyerID: buyerID,
            name: buyerName,
        }
        const response = await accountAgents[0].post('/api/Buyer')
            .send(postData);
        expect(response).to.have.status(200);
    });

    it('issues an identity for test-buyer1 for each account server', async () => {
        const identity = {
            participant: 'com.stockchainz.net.Buyer#test-buyer1',
            userID: uuid(),
            options: {},
        };

        for (let i = 0; i < 3; ++i) {
            const response = await accountAgents[i].post('/api/system/identities/issue')
                .send(identity);
            expect(response).to.have.status(200);

            cardFiles[i] = response.body;
        }
    });

    it('imports the business network card of test-buyer1 for each rest server', async () => {
        for (let i = 0; i < 3; ++i) {
            await fs.writeFile('test-buyer1.card', cardFiles[i]);

            const response = await restAgents[i].post('/api/wallet/import')
                .set('X-Access-Token', config.accessTokens.buyers[0][i])
                .set('Content-type', 'multipart/form-data')
                .attach('card', './test-buyer1.card', { contentType: 'application/octet-stream' });
            expect(response).to.have.status(204);
        }
    });
});

describe('Register test-buyer2', () => {
    let cardFiles = [];

    it('creates participant test-buyer2', async () => {
        const buyerID = 'test-buyer2';
        const buyerName = 'Test Buyer';

        const postData = {
            $class: 'com.stockchainz.net.Buyer',
            buyerID: buyerID,
            name: buyerName,
        }
        const response = await accountAgents[0].post('/api/Buyer')
            .send(postData);
        expect(response).to.have.status(200);
    });

    it('issues an identity for test-buyer2 for each account server', async () => {
        const identity = {
            participant: 'com.stockchainz.net.Buyer#test-buyer2',
            userID: uuid(),
            options: {},
        };

        for (let i = 0; i < 3; ++i) {
            const response = await accountAgents[i].post('/api/system/identities/issue')
                .send(identity);
            expect(response).to.have.status(200);

            cardFiles[i] = response.body;
        }
    });

    it('imports the business network card of test-buyer2 for each rest server', async () => {
        for (let i = 0; i < 3; ++i) {
            await fs.writeFile('test-buyer2.card', cardFiles[i]);

            const response = await restAgents[i].post('/api/wallet/import')
                .set('X-Access-Token', config.accessTokens.buyers[1][i])
                .set('Content-type', 'multipart/form-data')
                .attach('card', './test-buyer2.card', { contentType: 'application/octet-stream' });
            expect(response).to.have.status(204);
        }
    });
});
