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

describe('(EC-4) Item & Inventory', () => {
    describe('Item', () => {
        it('(TC-1) can be read by the owning seller', async () => {
            let response = await restAgents[0].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[0][0]);
    
            expect(response).to.have.status(200);
        });
        it('(TC-2) can be read by a non-seller', async () => {
            let response = await restAgents[0].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.buyers[0][0]);
    
            expect(response).to.have.status(200);
        });
        it('(TC-3) can be read by the non-owning seller', async () => {
            let response = await restAgents[0].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[1][0]);
    
            expect(response).to.have.status(200);
        });
    });

    describe('Inventory', () => {
        it('(TC-4) can be read by the owning seller', async () => {
            let response = await restAgents[0].get('/api/Inventory/INV_IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[0][0]);
    
            expect(response).to.have.status(200);
        });
        it('(TC-5) cannot be read by a non-seller', async () => {
            let response = await restAgents[0].get('/api/Inventory/INV_IT_1234')
                .set('X-Access-Token', config.accessTokens.buyers[0][0]);
    
            expect(response).to.not.have.status(200);
        });
        it('(TC-6) cannot be read by the non-owning seller', async () => {
            let response = await restAgents[0].get('/api/Inventory/INV_IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[1][0]);
    
            expect(response).to.not.have.status(200);
        });
    });
});
