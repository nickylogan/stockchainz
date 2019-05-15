class Config {
    constructor() {
        this.restServer = {
            host: process.env.REST_SERVER_HOST || 'localhost',
            port: process.env.REST_SERVER_PORT || 3000,
            url: '',
            authURL: '',
        };
        this.restServer.url =  `http://${this.restServer.host}:${this.restServer.port}/api`;
        this.restServer.authURL = `http://${this.restServer.host}:${this.restServer.port}/auth`;
        
        this.accountServer = {
            host: process.env.ACCOUNT_SERVER_HOST || 'localhost',
            port: process.env.ACCOUNT_SERVER_PORT || 3005,
            url: ''
        };
        this.accountServer.url = `http://${this.accountServer.host}:${this.accountServer.port}/api`;
    }
}

export default Config;