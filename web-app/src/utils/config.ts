export default class Config {
  market: {
    id: number;
    color: string;
    name: string;
  };
  restServer: { url: string; wsURL: string, authURL: string };
  accountServer: { url: string };

  constructor() {
    this.market = {
      id: 1,
      color: 'danger',
      name: 'Un Market'
    };
    this.restServer = {
      url: 'http://api-market1-stockchainz.serveo.net/api',
      wsURL: 'ws://api-market1-stockchainz.serveo.net',
      authURL: 'http://api-market1-stockchainz.serveo.net/auth'
    };

    this.accountServer = {
      url: 'http://account-market1-stockchainz.serveo.net/api'
    };
  }
}
