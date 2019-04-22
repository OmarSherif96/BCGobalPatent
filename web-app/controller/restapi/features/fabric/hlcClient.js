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
let fs = require('fs');
let path = require('path');

let itemTable = null;
const svc = require('./Z2B_Services');
const financeCoID = 'easymoney@easymoneyinc.com';

// Bring Fabric SDK network class
const { FileSystemWallet, Gateway } = require('fabric-network');

// A wallet stores a collection of identities for use
let walletDir = path.join(path.dirname(require.main.filename),'controller/restapi/features/fabric/_idwallet');
const wallet = new FileSystemWallet(walletDir);

const ccpPath = path.resolve(__dirname, 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);


/**
 * get orders for buyer with ID =  _id
 * @param {express.req} req - the inbound request object from the client
 *  req.body.id - the id of the buyer making the request
 *  req.body.userID - the user id of the buyer in the identity table making this request
 *  req.body.secret - the pw of this user.
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @returns {Array} an array of assets
 * @function
 */
exports.getMyOrders = async function (req, res, next) {
    // connect to the network
    let method = 'getMyOrders';
    console.log(method+' req.body.userID is: '+req.body.userID );
    let allOrders = new Array();

    // Main try/catch block
    try {

        // A gateway defines the peers used to access Fabric networks
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'User1@org1.example.com', discovery: { enabled: false } });

        // Get addressability to network
        const network = await gateway.getNetwork('mychannel');

        // Get addressability to contract
        const contract = await network.getContract('globalfinancing');

        // Get member state
        const responseMember = await contract.evaluateTransaction('GetState', req.body.userID);
        console.log('responseMember: ');
        console.log(JSON.parse(responseMember.toString()));
        let member = JSON.parse(JSON.parse(responseMember.toString()))

        // Get the orders for the member including their state
        for (let orderNo of member.orders) { 
            const response = await contract.evaluateTransaction('GetState', orderNo);
            console.log('response: ');
            console.log(JSON.parse(response.toString()));
            var _jsn = JSON.parse(JSON.parse(response.toString()));
            var _jsnItems = JSON.parse(_jsn.items);
            _jsn.items = _jsnItems;
            allOrders.push(_jsn);            
        }

        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        console.log('getMyOrders Complete');
        await gateway.disconnect();
        res.send({'result': 'success', 'orders': allOrders});
        
    } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
        res.send({'error': error.stack});
    } 
};


/**
 * return a json object built from the item table created by the autoload function
 * @param {express.req} req - the inbound request object from the client
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * return {Array} an array of assets
 * @function
 */
exports.getItemTable = function (req, res, next)
{
    
    if (itemTable === null)
    {
        let newFile = path.join(path.dirname(require.main.filename),'startup','itemList.txt');
        itemTable = JSON.parse(fs.readFileSync(newFile));
    }
    res.send(itemTable);
};

/**
 * orderAction - act on an order for a buyer
 * @param {express.req} req - the inbound request object from the client
 * req.body.action - string with buyer requested action
 * buyer available actions are:
 * Pay  - approve payment for an order
 * Dispute - dispute an existing order. requires a reason
 * Purchase - submit created order to seller for execution
 * Cancel - cancel an existing order
 * req.body.participant - string with buyer id
 * req.body.orderNo - string with orderNo to be acted upon
 * req.body.reason - reason for dispute, required for dispute processing to proceed
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @returns {Array} an array of assets
 * @function
 */
exports.patentAction = async function (req, res, next) {
    let method = 'patentAction';
    // Main try/catch block
    try {

        // A gateway defines the peers used to access Fabric networks
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'User1@org1.example.com', discovery: { enabled: false } });

        // Get addressability to network
        const network = await gateway.getNetwork('mychannel');

        // Get addressability to  contract
        const contract = await network.getContract('globalpatent');

        // Get state of patent
        const responsePatent = await contract.evaluateTransaction('GetState', req.body.patentNumber);
        console.log('responsePatent: ');
        console.log(JSON.parse(responsePatent.toString()));
        let patent = JSON.parse(JSON.parse(responsePatent.toString()));
        
        // Perform action on the order
        switch (req.body.action)
        {
        case 'VerifyPatent':
            console.log('VerifyPatent entered');
            const verifyResponse = await contract.submitTransaction('VerifyPatent', patent.patentNumber, patent.ownerId, patent.verifierId);
            console.log('verifyResponse: ');
            console.log(JSON.parse(verifyResponse.toString()));
            break;
        case 'RejectPatent':
            console.log('RejectPatent entered');
            const rejectResponse = await contract.submitTransaction('RejectPatent', patent.patentNumber, patent.ownerId, patent.verifierId);
            console.log('rejectResponse: ');
            console.log(JSON.parse(rejectResponse.toString()));            
            break;
        case 'PublishPatent':
            console.log('PublishPatent entered');
            const publishResponse = await contract.submitTransaction('PublishPatent', patent.patentNumber, patent.ownerId, patent.publisherId);
            console.log('publishResponse: ');
            console.log(JSON.parse(publishResponse.toString()));             
            break;
        default :
            console.log('default entered for action: '+req.body.action);
            res.send({'result': 'failed', 'error':' order '+req.body.orderNo+' unrecognized request: '+req.body.action});
        }
        
        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        console.log('orderAction Complete');
        await gateway.disconnect();
        res.send({'result': ' order '+req.body.patentNumber+' successfully updated to '+req.body.action});
            
    } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
        res.send({'error': error.stack});
    } 

};

/**
 * adds an order to the blockchain
 * @param {express.req} req - the inbound request object from the client
 * req.body.seller - string with seller id
 * req.body.buyer - string with buyer id
 * req.body.items - array with items for order
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @returns {Array} an array of assets
 * @function
 */
exports.addPatent = async function (req, res, next) {
    let method = 'addPatent';
    console.log(method+' req.body.owner is: '+req.body.owner);    
    let patentNumber = '00' + Math.floor(Math.random() * 10000);
    try {
        // A gateway defines the peers used to access Fabric networks
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'User1@org1.example.com', discovery: { enabled: false } });
        // Get addressability to network
        const network = await gateway.getNetwork('mychannel');
        // Get addressability to  contract
        const contract = await network.getContract('globalpatent');
        console.log("Req: ");
        console.log(patentNumber);
        console.log(req.body.priorArt);
        console.log(req.body.industry);
        console.log(req.body.description);
        console.log(req.body.owner);
        console.log(req.body.verifier);
        console.log(req.body.publisher);
        const createPatentResponse = await contract.submitTransaction('CreatePatent', req.body.owner, req.body.publisher, req.body.verifier, patentNumber, req.body.priorArt, req.body.industry, req.body.description);
        console.log('createPatentResponse: ')
        console.log(JSON.parse(createPatentResponse.toString()));

        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        console.log('add Patent Complete');
        await gateway.disconnect();
        res.send({'result': ' patent '+patentNumber+' successfully added'});

    } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
        res.send({'error': error.stack});
    } 
    
};



