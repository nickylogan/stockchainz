// import libraries
const request = require('supertest');

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const Config = require('./utils/config');
const config = new Config();

// setup request agents
const restAgents = config.restServer.map(s => request(s.url));

const itemID = 'IT_1234';
const itemName = 'Test Name';
const itemDescription = 'Test Description';

describe('(EC-1) CreateItem (error handling)', () => {
    it('(TC-9) should not allow creating a no-id item', async () => {
        const postData = {
            $class: 'com.stockchainz.net.CreateItem',
            itemID: '',
            name: itemName,
            description: itemDescription,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/CreateItem')
            .set('X-Access-Token', config.accessTokens.sellers[0][0])
            .send(postData);

        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[0][i])

            expect(response).to.have.status(404);
        }
    });
    it('(TC-10) should not allow creating a no-name item', async () => {
        const postData = {
            $class: 'com.stockchainz.net.CreateItem',
            itemID: itemID,
            name: '',
            description: itemDescription,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/CreateItem')
            .set('X-Access-Token', config.accessTokens.sellers[0][0])
            .send(postData);

        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[0][i])

            expect(response).to.have.status(404);
        }
    });
    it('(TC-11) should not allow a non-seller to create an item', async () => {
        const postData = {
            $class: 'com.stockchainz.net.CreateItem',
            itemID: itemID,
            name: itemName,
            description: itemDescription,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/CreateItem')
            .set('X-Access-Token', config.accessTokens.buyers[0][0])
            .send(postData);

        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[0][i])

            expect(response).to.have.status(404);
        }
    });
});
