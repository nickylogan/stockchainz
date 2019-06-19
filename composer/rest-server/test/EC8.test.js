// import libraries
const request = require('supertest');

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const Config = require('./utils/config');
const config = new Config();
const globals = require('./utils/globals');

// setup request agents
const restAgents = config.restServer.map(s => request(s.url));

describe('(EC-8) PlaceOrder (success scenario)', () => {
    it('(TC-23a) should allow a buyer to order an item', async () => {
        const postData = {
            $class: 'com.stockchainz.net.PlaceOrder',
            item: 'resource:com.stockchainz.net.Item#IT_1234',
            amount: 2,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/PlaceOrder')
            .set('X-Access-Token', config.accessTokens.buyers[0][0])
            .send(postData);

        expect(response).to.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Sale')
            .set('X-Access-Token', config.accessTokens.buyers[0][i])
            
            expect(response).to.have.status(200);
            expect(response.body).to.have.length(1);
            
            const sale = response.body[0];
            expect(sale).to.have.property('item', 'resource:com.stockchainz.net.Item#IT_1234');
            expect(sale).to.have.property('buyer', 'resource:com.stockchainz.net.Buyer#test-buyer1');
            expect(sale).to.have.property('amount', 2);
            expect(sale).to.have.property('status', 'UNCONFIRMED');
            globals.vars.saleID1 = sale.saleID;
        }
    });

    it('(TC-23b) should allow a buyer to order an item', async () => {
        const postData = {
            $class: 'com.stockchainz.net.PlaceOrder',
            item: 'resource:com.stockchainz.net.Item#IT_1234',
            amount: 4,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/PlaceOrder')
            .set('X-Access-Token', config.accessTokens.buyers[0][0])
            .send(postData);

        expect(response).to.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Sale')
                .set('X-Access-Token', config.accessTokens.buyers[0][i])
    
            expect(response).to.have.status(200);
            expect(response.body).to.have.length(2);
    
            let sales = response.body;
            sales = sales.filter(s => s.saleID !== globals.vars.saleID1);
            const sale = sales[0];
            expect(sale).to.have.property('item', 'resource:com.stockchainz.net.Item#IT_1234');
            expect(sale).to.have.property('buyer', 'resource:com.stockchainz.net.Buyer#test-buyer1');
            expect(sale).to.have.property('amount', 4);
            expect(sale).to.have.property('status', 'UNCONFIRMED');
            globals.vars.saleID2 = sale.saleID;
        }
    });
});
