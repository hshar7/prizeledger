const express = require('express');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const contractAddress = '';
const abi = [{"constant":false,"inputs":[{"name":"_id","type":"uint256"},{"name":"_owner_id","type":"uint256"},{"name":"_name","type":"string"}],"name":"name_and_award_prize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"prizes","outputs":[{"name":"id","type":"uint256"},{"name":"owner_id","type":"uint256"},{"name":"name","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"}];
const app = express();
const port = 8080;

// Web3 Node information
const user = "";
const pw = "";
const server = "";

web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('https://' + user + ':' + pw + '@' + server));

// error handling: for now just console.log
app.use((err, request, response, next) => {
    console.log(err);
    response.status(500).send('Something broke! '+ JSON.stringify(err));
});
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err);
    }
    console.log(`server is listening on ${port}`);
});

// Get prize data
function get_prize_data(prizeId, callback) {
    let contract = new web3.eth.Contract(abi, contractAddress);
    contract.methods.prizes(prizeId).call(function(error, result) {
        if (error) {
            console.log('error', error);
            callback(error, null);
        } else {
            console.log('result', result);
            callback(null, result);
        }
    })
        .catch(function(error) {
            console.log('call error ' + error);
            callback(error, null);
        });
}

// Display the prize data, if any
app.get('/prize', (req, response) => {
    get_prize_data(req.query.prizeId, function(err, res) {
        if (err) {
            response.json( {"err": err} );
        } else {
            response.json( {"res": res} );
        }
    });
});

app.post('/makePrize', (req, response) => {
    makePrize(req.body.prizeId, req.body.ownerId, req.body.name, req.body.description, function (err, res) {
        if (err) {
            response.json({"err": err});
        } else {
            response.json({"res": res});
        }
    });
});

function makePrize(id, ownerId, name, description, callback) {
    const newAccount = web3.eth.accounts.create();
    const callData = web3.eth.abi.encodeFunctionCall(abi[1], [id, ownerId, '' + name]); // 2nd function in the abi
    let tx = {
        from: newAccount.address,
        to: contractAddress,
        value: '0x0', // required eth transfer value, of course we don't deal with eth balances in private consortia
        data: callData,
        gas: 500000
    };

    let signedTx = new Tx(tx);
    signedTx.sign(Buffer.from(newAccount.privateKey.slice(2), 'hex'));
    let serializedTx = signedTx.serialize();

    web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
        .then(() => {
            console.log(`\tUpdated prize ${id}`);
            callback(null, "Success!");
        });
}
