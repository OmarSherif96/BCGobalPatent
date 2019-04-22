/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

// predefined order states
const patentStatus = {
    Created: {code: 1, text: 'Patent Created'},
    Verified: {code: 2, text: 'Patent Verified'},
    Rejected: {code: 3, text: 'Patent Rejected'},
    Published: {code: 4, text: 'Patent Published'}
};

// Global Finance contract
class GlobalPatent extends Contract {

     // instantiate with keys to collect participant ids
     async instantiate(ctx) {

        let ownerList = [];
        let verifierList = [];
        let publisherList = [];
        let patentList = [];

        await ctx.stub.putState('owners', Buffer.from(JSON.stringify(ownerList)));
        await ctx.stub.putState('verifiers', Buffer.from(JSON.stringify(verifierList)));
        await ctx.stub.putState('publishers', Buffer.from(JSON.stringify(publisherList)));
        await ctx.stub.putState('patents', Buffer.from(JSON.stringify(patentList)));
    }

    // add a owner object to the blockchain state identifited by the ownerId
    async RegisterOwner(ctx, ownerId, companyName) {

        let owner = {
            id: ownerId,
            companyName: companyName,
            type: 'owner',
            patents: []
        };
        await ctx.stub.putState(ownerId, Buffer.from(JSON.stringify(owner)));

        //add ownerId to 'owners' key
        let data = await ctx.stub.getState('owners');
        if (data) {
            let owners = JSON.parse(data.toString());
            owners.push(ownerId);
            await ctx.stub.putState('owners', Buffer.from(JSON.stringify(owners)));
        } else {
            throw new Error('owners not found');
        }

        // return owner object
        return JSON.stringify(owner);
    }

    // add a verifier object to the blockchain state identifited by the verifierId
    async RegisterVerifier(ctx, verifierId, companyName) {

        let verifier = {
            id: verifierId,
            companyName: companyName,
            type: 'verifier',
            patents: []
        };
        await ctx.stub.putState(verifierId, Buffer.from(JSON.stringify(verifier)));

        // add verifierId to 'verifier' key
        let data = await ctx.stub.getState('verifiers');
        if (data) {
            let verifiers = JSON.parse(data.toString());
            verifiers.push(verifierId);
            await ctx.stub.putState('verifiers', Buffer.from(JSON.stringify(verifiers)));
        } else {
            throw new Error('verifiers not found');
        }

        // return verifier object
        return JSON.stringify(verifier);
    }

    // add a publisher object to the blockchain state identifited by the publisherId
    async RegisterPublisher(ctx, publisherId, companyName) {

        let publisher = {
            id: publisherId,
            companyName: companyName,
            type: 'publisher',
            patents: []
        };
        await ctx.stub.putState(publisherId, Buffer.from(JSON.stringify(publisher)));

        // add publisherId to 'publishers' key
        let data = await ctx.stub.getState('publishers');
        if (data) {
            let publishers = JSON.parse(data.toString());
            publishers.push(publisherId);
            await ctx.stub.putState('publishers', Buffer.from(JSON.stringify(publishers)));
        } else {
            throw new Error('publishers not found');
        }

        // return shipper object
        return JSON.stringify(publisher);
    }

    // add a patent object to the blockchain state identifited by the patentNumber
    async CreatePatent(ctx, patentNumber, priorArt, industry, description, ownerId) {
        console.log("CreatePatent");
        console.log("reached here");
        // verify ownerId
        let ownerData = await ctx.stub.getState(ownerId);
        let owner;
        if (ownerData) {
            owner = JSON.parse(ownerData.toString());
            if (owner.type !== 'owner') {
                throw new Error('owner not identified');
            }
        } else {
            throw new Error('owner not found');
        }

        //  // verify verifierId
        //  let verifierData = await ctx.stub.getState(verifierId);
        //  let verifier;
        //  if (verifierData) {
        //     verifier = JSON.parse(verifierData.toString());
        //      if (verifier.type !== 'verifier') {
        //          throw new Error('verifier not identified');
        //      }
        //  } else {
        //      throw new Error('verifier not found');
        //  }

        // // verify publisherId
        // let publisherData = await ctx.stub.getState(publisherId);
        // let publisher;
        // if (publisherData) {
        //     publisher = JSON.parse(publisherData.toString());
        //     if (publisher.type !== 'publisher') {
        //         throw new Error('publisher not identified');
        //     }
        // } else {
        //     throw new Error('publisher not found');
        // }

        console.log("reached patent");

        let patent = {
            patentNumber: patentNumber,
            priorArt: priorArt,
            industry: industry,
            description: description,
            status: JSON.stringify(patentStatus.Created),
            owners: [{ownerId: ownerId}]
            // verifierId: verifierId,
            // publisherId: publisherId
        };

        //add patent to owner
        owner.patents.push(patentNumber);
        await ctx.stub.putState(ownerId, Buffer.from(JSON.stringify(owner)));

        //store patent identified by patentNumber
        await ctx.stub.putState(patentNumber, Buffer.from(JSON.stringify(patent)));

        // return patent object
        return JSON.stringify(patent);
    }

    async VerifyPatent(ctx, patentNumber, ownerId, verifierId) {

        // get patent json
        let data = await ctx.stub.getState(patentNumber);
        let patent;
        if (data) {
            patent = JSON.parse(data.toString());
        } else {
            throw new Error('patent not found');
        }

        // verify ownerId
        let ownerData = await ctx.stub.getState(ownerId);
        let owner;
        if (ownerData) {
            owner = JSON.parse(ownerData.toString());
            if (owner.type !== 'owner') {
                throw new Error('owner not identified');
            }
        } else {
            throw new Error('owner not found');
        }

        // verify verifierId
        let verifierData = await ctx.stub.getState(verifierId);
        let verifier;
        if (verifierData) {
            verifier = JSON.parse(verifierData.toString());
            if (verifier.type !== 'verifier') {
                throw new Error('verifier not identified');
            }
        } else {
            throw new Error('verifier not found');
        }

        // update patent status from created to verified
        if (patent.status == JSON.stringify(patentStatus.Created)) {
            patent.status = JSON.stringify(patentStatus.Verified);
            await ctx.stub.putState(patentNumber, Buffer.from(JSON.stringify(patent)));

            //add patent to the verifier after being verified
            verifier.patents.push(patentNumber);
            await ctx.stub.putState(verifierId, Buffer.from(JSON.stringify(verifier)));

            return JSON.stringify(patent);
        } else {
            throw new Error('patent not created');
        }
    }

    async RejectPatent(ctx, patentNumber, ownerId, verifierId) {

        // get patent json
        let data = await ctx.stub.getState(patentNumber);
        let patent;
        if (data) {
            patent = JSON.parse(data.toString());
        } else {
            throw new Error('patent not found');
        }

        // verify ownerId
        let ownerData = await ctx.stub.getState(ownerId);
        let owner;
        if (ownerData) {
            owner = JSON.parse(ownerData.toString());
            if (owner.type !== 'owner') {
                throw new Error('owner not identified');
            }
        } else {
            throw new Error('owner not found');
        }

        // verify verifierId
        let verifierData = await ctx.stub.getState(verifierId);
        let verifier;
        if (verifierData) {
            verifier = JSON.parse(verifierData.toString());
            if (verifier.type !== 'verifier') {
                throw new Error('verifier not identified');
            }
        } else {
            throw new Error('verifier not found');
        }

        //update patent from created to rejected
        if (patent.status == JSON.stringify(patentStatus.Created)) {
            patent.status = JSON.stringify(patentStatus.Rejected);
            await ctx.stub.putState(patentNumber, Buffer.from(JSON.stringify(patent)));

            //add patent to the publisher after being published
            publisher.patents.push(patentNumber);
            await ctx.stub.putState(publisherId, Buffer.from(JSON.stringify(publisher)));

            return JSON.stringify(patent);
        } else {
            throw new Error('patent not created');
        }
    }

    async PublishPatent(ctx, patentNumber, ownerId, publisherId) {

        // get patent json
        let data = await ctx.stub.getState(patentNumber);
        let patent;
        if (data) {
            patent = JSON.parse(data.toString());
        } else {
            throw new Error('patent not found');
        }

        // verify ownerId
        let ownerData = await ctx.stub.getState(ownerId);
        let owner;
        if (ownerData) {
            owner = JSON.parse(ownerData.toString());
            if (owner.type !== 'owner') {
                throw new Error('owner not identified');
            }
        } else {
            throw new Error('owner not found');
        }

        // verify publisherId
        let publisherData = await ctx.stub.getState(publisherId);
        let publisher;
        if (publisherData) {
            publisher = JSON.parse(publisherData.toString());
            if (publisher.type !== 'publisher') {
                throw new Error('publisher not identified');
            }
        } else {
            throw new Error('publisher not found');
        }

        //update patent from verified to published
        if (patent.status == JSON.stringify(patentStatus.Verified)) {
            patent.status = JSON.stringify(patentStatus.Published);
            await ctx.stub.putState(patentNumber, Buffer.from(JSON.stringify(patent)));
            return JSON.stringify(patent);
        } else {
            throw new Error('patent not verified');
        }
    }

      // get the state from key
    async GetState(ctx, key) {
        let data = await ctx.stub.getState(key);
        let jsonData = JSON.parse(data.toString());
        return JSON.stringify(jsonData);
    }
}

module.exports = GlobalPatent;