/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


'use strict';

const fs = require('fs');
const path = require('path');

// Bring Fabric SDK network class
const { FileSystemWallet, Gateway } = require('fabric-network');

// A wallet stores a collection of identities for use
let walletDir = path.join(path.dirname(require.main.filename),'controller/restapi/features/fabric/_idwallet');
const wallet = new FileSystemWallet(walletDir);

const ccpPath = path.resolve(__dirname, 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);


/**
 * retrieve array of member registries
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @returns {Object} array of registries
 * @function
 */
exports.getRegistries = function(req, res, next)
{
    var allRegistries = [ 
        [ 'Owner' ],
        [ 'Verifier' ],
        [ 'Publisher' ]
    ];
    res.send({'result': 'success', 'registries': allRegistries});
   
};


/**
 * retrieve array of members from specified registry type
 * @param {express.req} req - the inbound request object from the client
 *  req.body.registry: _string - type of registry to search; e.g. 'Buyer', 'Seller', etc.
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @returns {Object} an array of members
 * @function
 */
exports.getMembers = async function(req, res, next) {

    console.log('getMembers');
    let allMembers = new Array();
    let members;

    // Main try/catch block
    try {

        // A gateway defines the peers used to access Fabric networks
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'User1@org1.example.com', discovery: { enabled: false } });

        // Get addressability to network
        const network = await gateway.getNetwork('mychannel');

        // Get addressability to  contract
        const contract = await network.getContract('globalpatent');
                
        switch (req.body.registry)
        {
            case 'Owner':
                const responseOwner = await contract.evaluateTransaction('GetState', "owners");
                console.log('responseOwner: ');
                console.log(JSON.parse(responseOwner.toString()));
                members = JSON.parse(JSON.parse(responseOwner.toString()));
                break;            
            case 'Verifier':
                const responseVerifier = await contract.evaluateTransaction('GetState', "verifiers");
                console.log('responseVerifier: ');
                console.log(JSON.parse(responseVerifier.toString()));
                members = JSON.parse(JSON.parse(responseVerifier.toString()));
                break;
            case 'Publisher':
                const responsePublisher = await contract.evaluateTransaction('GetState', "publishers");
                console.log('responsePublisher: ');
                console.log(JSON.parse(responsePublisher.toString()));
                members = JSON.parse(JSON.parse(responsePublisher.toString()));
                break; 
            default:
                res.send({'error': 'body registry not found'});
        }
        
        // Get state of the members
        for (const member of members) { 
            const response = await contract.evaluateTransaction('GetState', member);
            console.log('response: ');
            console.log(JSON.parse(response.toString()));
            var _jsn = JSON.parse(JSON.parse(response.toString()));                       
            allMembers.push(_jsn); 
        }

        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        console.log('getMembers Complete');
        await gateway.disconnect();
        res.send({'result': 'success', 'members': allMembers});
                
    } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
        res.send({'error': error.stack});
    } 
         
};



/**
 * gets the assets from the order registry
 * @param {express.req} req - the inbound request object from the client
 *  req.body.type - the type of individual making the request (admin, buyer, seller, etc)
 *  req.body.id - the id of the individual making the request
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @returns {Array} - an array of assets
 * @function
 */
exports.getAssets = async function(req, res, next) {

    console.log('getAssets');
    let allPatents = new Array();

    // Main try/catch block
    try {

        // A gateway defines the peers used to access Fabric networks
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'User1@org1.example.com', discovery: { enabled: false } });

        // Get addressability to network
        const network = await gateway.getNetwork('mychannel');

        // Get addressability to  contract
        const contract = await network.getContract('globalpatent');
        
        const responseOwner = await contract.evaluateTransaction('GetState', "owners");
        console.log('responseOwner: ');
        console.log(JSON.parse(responseOwner.toString()));
        var owners = JSON.parse(JSON.parse(responseOwner.toString()));

        for (let owner of owners) { 
            const ownerResponse = await contract.evaluateTransaction('GetState', owner);
            console.log('response: ');
            console.log(JSON.parse(ownerResponse.toString()));
            var _ownerjsn = JSON.parse(JSON.parse(ownerResponse.toString()));       
            
            for (let patent of _ownerjsn.patents) { 
                const response = await contract.evaluateTransaction('GetState', patent);
                console.log('response: ');
                console.log(JSON.parse(response.toString()));
                var _jsn = JSON.parse(JSON.parse(response.toString()));
                console.log(' _jsn: ');
                console.log(_jsn);
                var _jsnPatentNumber = _jsn.patentNumber;
                console.log('_jsnPatentNUmber:');
                console.log(_jsnPatentNumber);
                _jsn.patentNumber = _jsnPatentNumber;
                console.log('_jsn.patentNumber');
                console.log(_jsn.patentNumber);
                allPatents.push(_jsn);            
            }                           
        }
        
        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        console.log('getAssets Complete');
        await gateway.disconnect();
        res.send({'result': 'success', 'patents': allPatents});
        
    } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
        res.send({'error': error.stack});
    } 
};


/**
 * Adds a new member to the specified registry
 * @param {express.req} req - the inbound request object from the client
 *  req.body.companyName: _string - member company name
 *  req.body.type: _string - member type (registry type); e.g. 'Buyer', 'Seller', etc.
 *  req.body.id: _string - id of member to add (email address)
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @returns {JSON} object with success or error results
 * @function
 */
exports.addMember = async function(req, res, next) {

    console.log('addMember');
    let members;

    // Main try/catch block
    try {

        // A gateway defines the peers used to access Fabric networks
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'User1@org1.example.com', discovery: { enabled: false } });

        // Get addressability to network
        const network = await gateway.getNetwork('mychannel');

        // Get addressability to  contract
        const contract = await network.getContract('globalpatent');        

        switch (req.body.type)
        {
            case 'Owner':
                const responseOwner = await contract.evaluateTransaction('GetState', "owners");
                members = JSON.parse(JSON.parse(responseOwner.toString()));
                break;            
            case 'Verifier':
                const responseVerifier = await contract.evaluateTransaction('GetState', "verifiers");
                members = JSON.parse(JSON.parse(responseVerifier.toString()));
                break;
            case 'Publisher':
                const responsePublisher = await contract.evaluateTransaction('GetState', "publishers");
                members = JSON.parse(JSON.parse(responsePublisher.toString()));
                break; 
            default:
                res.send({'error': 'body type not found'});
        }

        for (let member of members) { 
            if (member == req.body.id) {
                res.send({'error': 'member id already exists'});
            }
        }
        
        console.log('\nreq.body.id: ' + req.body.id);
        console.log('member.type: ' + req.body.type);
        console.log('member.companyName: ' + req.body.companyName);

        var transaction = 'Register' + req.body.type;
        console.log('transaction: ' + transaction);
                    
        //register
        const response = await contract.submitTransaction(transaction, req.body.id, req.body.companyName);
        console.log('transaction response: ')
        console.log(JSON.parse(response.toString()));  

        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        console.log('AutoLoad Complete');
        await gateway.disconnect();
        res.send(req.body.companyName+' successfully added');
   
    } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
        res.send({'error': error.stack});
    } 
    
};

