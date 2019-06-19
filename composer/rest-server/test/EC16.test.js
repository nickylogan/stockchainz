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

describe('(EC-16) DeleteItem (success scenario)', () => {
    it('(TC-15) should allow a seller to delete an item', async () => {
        const postData = {
            $class: 'com.stockchainz.net.DeleteItem',
            item: 'resource:com.stockchainz.net.Item#IT_1234',
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/DeleteItem')
            .set('X-Access-Token', config.accessTokens.sellers[0][0])
            .send(postData);
        
        expect(response).to.have.status(200);
    
        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[0][i]);
    
            expect(response).to.have.status(404);
        }
    });
});
