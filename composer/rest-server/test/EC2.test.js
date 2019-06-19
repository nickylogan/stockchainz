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
const itemName = 'Test Item';
const itemDescription = 'Test Description';

describe('(EC-2) CreateItem (success scenario)', () => {
    it('(TC-7) should allow a seller to create an item', async () => {
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

        expect(response).to.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[0][i])

            expect(response).to.have.status(200);
            expect(response.body).to.have.property('itemID', 'IT_1234');
            expect(response.body).to.have.property('name', 'Test Item');
            expect(response.body).to.have.property('description', 'Test Description');
            expect(response.body).to.have.property('amount', 0);
            expect(response.body).to.have.property('seller', 'resource:com.stockchainz.net.Seller#test-seller1');;
        }
    });
});
