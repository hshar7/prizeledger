var solc = require('solc');
var fs = require('fs');
showABI();

function showABI() {
    const source = fs.readFileSync(__dirname+'/contracts/PrizeLedger.sol');
    const compiled = solc.compile(source.toString(), 1);
    const abi = compiled.contracts[':PrizeLedger'].interface;
    console.log("abi", abi);
}