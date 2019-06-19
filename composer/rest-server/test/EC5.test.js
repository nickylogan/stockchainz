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


describe('(EC-5) RestockItem (error handling)', () => {
    it('(TC-19) should not allow a non-seller to restock an item', async () => {
        const postData = {
            $class: 'com.stockchainz.net.RestockItem',
            item: 'resource:com.stockchainz.net.Item#IT_1234',
            amount: 5,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/RestockItem')
            .set('X-Access-Token', config.accessTokens.buyers[0][0])
            .send(postData);

        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.buyers[0][i]);

            expect(response).to.have.status(200);
            expect(response.body).to.have.property('amount', 0);
        }
    });

    it('(TC-20) should not allow a seller to restock another seller\'s item', async () => {
        const postData = {
            $class: 'com.stockchainz.net.RestockItem',
            item: 'resource:com.stockchainz.net.Item#IT_1234',
            amount: 5,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/RestockItem')
            .set('X-Access-Token', config.accessTokens.sellers[1][0])
            .send(postData);

        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[1][i]);

            expect(response).to.have.status(200);
            expect(response.body).to.have.property('amount', 0);
        }
    });

    it('(TC-21) should not allow negative restock', async () => {
        const postData = {
            $class: 'com.stockchainz.net.RestockItem',
            item: 'resource:com.stockchainz.net.Item#IT_1234',
            amount: -1,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/RestockItem')
            .set('X-Access-Token', config.accessTokens.sellers[0][0])
            .send(postData);

        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[0][i]);

            expect(response).to.have.status(200);
            expect(response.body).to.have.property('amount', 0);
        }
    });

    it('(TC-22) should not allow zero restock', async () => {
        const postData = {
            $class: 'com.stockchainz.net.RestockItem',
            item: 'resource:com.stockchainz.net.Item#IT_1234',
            amount: 0,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/RestockItem')
            .set('X-Access-Token', config.accessTokens.sellers[0][0])
            .send(postData);

        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[0][i]);

            expect(response).to.have.status(200);
            expect(response.body).to.have.property('amount', 0);
        }
    });
});
