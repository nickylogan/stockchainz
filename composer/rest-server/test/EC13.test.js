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

describe('(EC-13) UpdateItem (error handling)', () => {
    it('(TC-13) should not allow a non-seller to update an item', async () => {
        const postData = {
            $class: 'com.stockchainz.net.UpdateItem',
            item: 'resource:com.stockchainz.net.Item#IT_1234',
            newDescription: 'New Description',
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/UpdateItem')
            .set('X-Access-Token', config.accessTokens.buyers[0][0])
            .send(postData);
        
        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.buyers[0][i]);
    
            expect(response).to.have.status(200);
            expect(response.body.description).not.equal('New Description');
        }
    });

    it('(TC-14) should not allow a seller to update another seller\'s item', async () => {
        const postData = {
            $class: 'com.stockchainz.net.UpdateItem',
            item: 'resource:com.stockchainz.net.Item#IT_1234',
            newDescription: 'New Description',
            transactionId: '',
            timestamp: (new Date()).toISOString(),
        };

        let response = await restAgents[0].post('/api/UpdateItem')
            .set('X-Access-Token', config.accessTokens.sellers[1][0])
            .send(postData);
        
        expect(response).to.not.have.status(200);

        for (let i = 0; i < 3; ++i) {
            response = await restAgents[i].get('/api/Item/IT_1234')
                .set('X-Access-Token', config.accessTokens.sellers[1][i]);

            expect(response).to.have.status(200);
            expect(response.body.description).not.equal('New Description');
        }
    });
});
