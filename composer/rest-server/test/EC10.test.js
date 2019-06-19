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

describe('(EC-10) ConfirmSale (error handling)', () => {
    it('(TC-30) should not allow a non-seller to confirm a sale', async () => {
        const postData = {
            $class: 'com.stockchainz.net.ConfirmSale',
            sale: `resource:com.stockchainz.net.Sale#${globals.vars.saleID1}`,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };
        
        let response = await restAgents[0].get('/api/Inventory/INV_IT_1234')
            .set('X-Access-Token', config.accessTokens.sellers[0][0]);

        expect(response).to.have.status(200);
        const length = response.body.changes.length;
        
        response = await restAgents[0].post('/api/ConfirmSale')
            .set('X-Access-Token', config.accessTokens.buyers[0][0])
            .send(postData);

        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[0][i]);
    
            expect(response).to.have.status(200);
            expect(response.body).to.have.property('amount', 5);
    
    
            response = await restAgents[i].get('/api/Inventory/INV_IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[0][i]);
    
            expect(response).to.have.status(200);
            expect(response.body).to.have.property('changes').to.have.lengthOf(length);
    
    
            response = await restAgents[i].get(`/api/Sale/${globals.vars.saleID1}`)
                .set('X-Access-Token', config.accessTokens.sellers[0][i]);
    
            expect(response).to.have.status(200);
            expect(response.body).to.have.property('status', 'UNCONFIRMED');
        }

    });

    it('(TC-31) should not allow a seller to confirm another seller\'s sale', async () => {
        const postData = {
            $class: 'com.stockchainz.net.ConfirmSale',
            sale: `resource:com.stockchainz.net.Sale#${globals.vars.saleID1}`,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].get('/api/Inventory/INV_IT_1234')
            .set('X-Access-Token', config.accessTokens.sellers[0][0]);

        expect(response).to.have.status(200);
        const length = response.body.changes.length;
        
        response = await restAgents[0].post('/api/ConfirmSale')
            .set('X-Access-Token', config.accessTokens.sellers[1][0])
            .send(postData);

        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[0][i]);
    
            expect(response).to.have.status(200);
            expect(response.body).to.have.property('amount', 5);
    
    
            response = await restAgents[i].get('/api/Inventory/INV_IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[0][i]);
    
            expect(response).to.have.status(200);
            expect(response.body).to.have.property('changes').to.have.lengthOf(length);
    
    
            response = await restAgents[i].get(`/api/Sale/${globals.vars.saleID1}`)
                .set('X-Access-Token', config.accessTokens.sellers[0][i]);
    
            expect(response).to.have.status(200);
            expect(response.body).to.have.property('status', 'UNCONFIRMED');
        }
    });

    it('(TC-32) should not allow confirming a non-existent sale', async () => {
        const postData = {
            $class: 'com.stockchainz.net.ConfirmSale',
            sale: `resource:com.stockchainz.net.Sale#S_9999`,
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/ConfirmSale')
            .set('X-Access-Token', config.accessTokens.buyers[0][0])
            .send(postData);

        expect(response).to.not.have.status(200);
    });
});
