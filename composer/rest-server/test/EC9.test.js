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

describe('(EC-9) Sale', () => {
    it('(TC-35) can be read by the seller', async () => {
        let response = await restAgents[0].get(`/api/Sale/${globals.vars.saleID1}`)
            .set('X-Access-Token', config.accessTokens.sellers[0][0]);

        expect(response).to.have.status(200);
    });

    it('(TC-36) can be read by the buyer', async () => {
        let response = await restAgents[0].get(`/api/Sale/${globals.vars.saleID1}`)
            .set('X-Access-Token', config.accessTokens.buyers[0][0]);

        expect(response).to.have.status(200);
    });

    it('(TC-37) cannot be read by another seller', async () => {
        let response = await restAgents[0].get(`/api/Sale/${globals.vars.saleID1}`)
            .set('X-Access-Token', config.accessTokens.sellers[1][0]);

        expect(response).to.have.status(404);
    });
    
    it('(TC-38) cannot be read by another buyer', async () => {
        let response = await restAgents[0].get(`/api/Sale/${globals.vars.saleID1}`)
            .set('X-Access-Token', config.accessTokens.buyers[1][0]);
        
	expect(response).to.have.status(404);
    });
});
