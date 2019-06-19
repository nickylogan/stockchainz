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


describe('(EC-7) PlaceOrder (error handling)', () => {
    it('(TC-24) should not allow a non-buyer to order an item', async () => {
        const postData = {
            $class: 'com.stockchainz.net.PlaceOrder',
            item: 'resource:com.stockchainz.net.Item#IT_1234',
            amount: 2,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/PlaceOrder')
            .set('X-Access-Token', config.accessTokens.sellers[0][0])
            .send(postData);

        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Sale')
                .set('X-Access-Token', config.accessTokens.sellers[0][i]);

            expect(response).to.have.status(200);
            expect(response.body).to.have.length(0);
        }
    });

    it('(TC-25) should not allow ordering a non-existent item', async () => {
        const postData = {
            $class: 'com.stockchainz.net.PlaceOrder',
            item: 'resource:com.stockchainz.net.Item#IT_9999',
            amount: 2,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/PlaceOrder')
            .set('X-Access-Token', config.accessTokens.buyers[0][0])
            .send(postData);

        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Sale')
                .set('X-Access-Token', config.accessTokens.buyers[0][i])

            expect(response).to.have.status(200);
            expect(response.body).to.have.length(0);
        }
    });

    it('(TC-26) should not allow an order with negative amount', async () => {
        const postData = {
            $class: 'com.stockchainz.net.PlaceOrder',
            item: 'resource:com.stockchainz.net.Item#IT_1234',
            amount: -1,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/PlaceOrder')
            .set('X-Access-Token', config.accessTokens.buyers[0][0])
            .send(postData);

        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Sale')
                .set('X-Access-Token', config.accessTokens.buyers[0][i]);

            expect(response).to.have.status(200);
            expect(response.body).to.have.length(0);
        }
    });

    it('(TC-27) should not allow an order with a zero amount', async () => {
        const postData = {
            $class: 'com.stockchainz.net.PlaceOrder',
            item: 'resource:com.stockchainz.net.Item#IT_1234',
            amount: 0,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/PlaceOrder')
            .set('X-Access-Token', config.accessTokens.buyers[0][0])
            .send(postData);

        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Sale')
                .set('X-Access-Token', config.accessTokens.buyers[0][i]);

            expect(response).to.have.status(200);
            expect(response.body).to.have.length(0);
        }
    });

    it('(TC-28) should not allow an order if the item in stock isn\'t enough', async () => {
        const postData = {
            $class: 'com.stockchainz.net.PlaceOrder',
            item: 'resource:com.stockchainz.net.Item#IT_1234',
            amount: 6,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/PlaceOrder')
            .set('X-Access-Token', config.accessTokens.buyers[0][0])
            .send(postData);

        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Sale')
                .set('X-Access-Token', config.accessTokens.buyers[0][i]);

            expect(response).to.have.status(200);
            expect(response.body).to.have.length(0);
        }
    });
});
