const express = require('express');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const contractAddress = '';
const abi = [{"constant":false,"inputs":[{"name":"_id","type":"uint256"},{"name":"_owner_id","type":"uint256"},{"name":"_name","type":"string"}],"name":"name_and_award_prize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"prizes","outputs":[{"name":"id","type":"uint256"},{"name":"owner_id","type":"uint256"},{"name":"name","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"}];
const app = express();
const port = 8080;

// DB
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'PrizeLedger';

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

// Display the prize data, if any
app.get('/validatePrize', (req, response) => {
    validate_prize_data(req.query.prizeId, req.query.ownerId, function(err, res) {
        if (err) {
            response.json( {"err": err} );
        } else {
            response.json( res );
        }
    });
});


// Get prize data
function validate_prize_data(prizeId, ownerId, callback) {
    let contract = new web3.eth.Contract(abi, contractAddress);
    contract.methods.prizes(prizeId).call(function(error, result) {
        if (error) {
            console.log('error', error);
            callback(error, null);
        } else {
            console.log('result', result);
            // returnedObj = JSON.parse(result);
            if (result['owner_id'] === ownerId) {
                callback(null, "Success");
            } else {
                callback(null, "Invalid");
            }
        }
    }).catch(function(error) {
        console.log('call error ' + error);
        callback(error, null);
    });
}

app.get('/prizes', (req, response) => {
    get_all_prizes(function (err, res) {
        if (err) {
            response.json({"err": err});
        } else {
            response.json(res);
        }
    });
});

function get_all_prizes(callback) {
    MongoClient.connect(url, function(err, client) {
        assert.equal(null, err);
        console.log("Connected correctly to server");

        const db = client.db(dbName);

        findDocuments(db, function(data) {
            callback(null, data);
            client.close();
        });
    });
}

const findDocuments = function(db, callback) {
    const collection = db.collection('prizes');
    // Find some documents
    collection.find({}).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log("Found the following records");
        console.log(docs);
        callback(docs);
    });
};

app.post('/makePrize', (req, response) => {
    makePrize(req.body.prizeId, req.body.ownerId, req.body.prizeName, req.body.ownerName, req.body.secondPlaceName, function (err, res) {
        if (err) {
            response.json({"err": err});
        } else {
            response.json({"res": res});
        }
    });
});

const insertDocument = function(data, db, callback) {
    const collection = db.collection('prizes');
    // Insert some documents
    collection.insertMany([
        data
    ], function(err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        assert.equal(1, result.ops.length);
        console.log("Inserted document into the collection");
        callback(result);
    });
};

function makePrize(prizeId, ownerId, prizeName, ownerName, secondPlaceName, callback) {
    const newAccount = web3.eth.accounts.create();
    const callData = web3.eth.abi.encodeFunctionCall(abi[0], [prizeId, ownerId, '' + prizeName]); // 2nd function in the abi
    let tx = {
        nonce: '0x00',
        gas: 500000,
        to: contractAddress,
        value: '0x00', // required eth transfer value, of course we don't deal with eth balances in private consortia
        data: callData
    };

    // Add it to Mongo Collection
    data = {
        prizeId: prizeId,
        prizeName: prizeName,
        ownerId: ownerId,
        ownerName: ownerName,
        secondPlaceName: secondPlaceName
    };
    MongoClient.connect(url, function(err, client) {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);
        insertDocument(data, db, function() {
            client.close();
        });
    });

    let signedTx = new Tx(tx);
    signedTx.sign(Buffer.from(newAccount.privateKey.slice(2), 'hex'));
    let serializedTx = signedTx.serialize();

    web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), function (err, hash) {
        if (!err) {
            console.log(hash); // "0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385"
            callback(null, hash);
        } else {
            console.log(err);
            callback(err, null);
        }
    });
}
