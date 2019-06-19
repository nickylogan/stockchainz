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
const itemName = 'New Name';
const itemDescription = 'New Description';

describe('(EC-3) CreateItem (error handling)', () => {
    it('(TC-8) should not allow creating a duplicate item', async () => {
        const postData = {
            $class: 'com.stockchainz.net.CreateItem',
            itemID: itemID,
            name: itemName,
            description: itemDescription,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/CreateItem')
            .set('X-Access-Token', config.accessTokens.sellers[0][0])
            .send(postData);

        expect(response).to.not.have.status(200);
    });
});
