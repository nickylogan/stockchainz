class Config {
    constructor() {
        this.restServer = [
            { url: 'http://localhost:3000' },
            { url: 'http://localhost:4000' },
            { url: 'http://localhost:5000' },
        ];
        this.accountServer = [
            { url: 'http://localhost:3005' },
            { url: 'http://localhost:4005' },
            { url: 'http://localhost:5005' },
        ];

        this.accessTokens = {
            sellers: [
                [
                    process.env.SELLER1_TOKEN1,
                    process.env.SELLER1_TOKEN2,
                    process.env.SELLER1_TOKEN3,
                ],
                [
                    process.env.SELLER2_TOKEN1,
                    process.env.SELLER2_TOKEN2,
                    process.env.SELLER2_TOKEN3,
                ],
            ],
            buyers: [
                [
                    process.env.BUYER1_TOKEN1,
                    process.env.BUYER1_TOKEN2,
                    process.env.BUYER1_TOKEN3,
                ],
                [
                    process.env.BUYER2_TOKEN1,
                    process.env.BUYER2_TOKEN2,
                    process.env.BUYER2_TOKEN3,
                ],
            ],
        };
    }
}

module.exports = Config;
