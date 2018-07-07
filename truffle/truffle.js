var Web3 = require('web3');

module.exports = {
    networks: {
        supplier_node: {
            provider: () => {
                return new Web3.providers.HttpProvider();
            },
            network_id: "*", // Match any network id
            gasPrice: 0,
            gas: 4500000
        }
    }
};
