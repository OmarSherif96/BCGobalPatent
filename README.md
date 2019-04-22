
## 1. Install IBM Blockchain extension on VSCode
a. Open VScode inside contract folder  
b. Package the smart contract globalPatent.js  
c. Install the chaincode  
d. Instantiate the chaincode (Type instantiate in optional settings and press enter twice)  

## 2. Run the client 
Changes made in these files: controller/restapi/features/fabric/ autoload.js & getBlockchain.js & hlcAdmin.js

In a new terminal, navigate to the `web-app` directory:

  ```bash
  cd global-financing-blockchain/web-app/
  ```

  Build the node dependencies:
  ```bash
  npm install
  ```

  Run the application:
  ```bash
  npm start
  ```

## 3. Postman

Setup Autoload  
File: Autoload.js  
  Post:
  http://localhost:6001/setup/autoLoad  

Get Blockchain  
File: getBlockchain.js  
  Post:
  http://localhost:6001/fabric/getBlockchain  

Add Member  
File: hlcAdmin.js  
  Post:
  http://localhost:6001/fabric/admin/addMember  
  ```bash
  Body:  
  {
  	"type" : "Owner",
  	"id" : "Ahmed",
  	"companyName" : "IBMX"
  }
  ``` 

Get Member  
File : hlcAdmin.js  
  Post:
  http://localhost:6001/fabric/admin/getMembers  
  ```bash
  Body:
  {
  	"registry": "Owner"
  }
  ```  

Get Assets(Patents)  
File : hlcAdmin.js  
  Post: 
  http://localhost:6001/fabric/admin/getAssets  

Create Patent  
File : hlcClient.js  
  Post:
  http://localhost:6001/fabric/client/addPatent
  ```bash
  Body:
  {
    "owner": "owner1@hsbc.com",
    "verifier": "verifier1@nbe.com",
    "publisher": "publisher1@fgb.com",
    "priorArt": "yes",
    "industry": "science",
    "description": "newinvention"
  }
  ```

Patent Actions (action: VerifyPatent/RejectPatent/PublishPatent)  
File : hlcClient.js  
  Post:
  http://localhost:6001/fabric/client/patentAction
  ```bash
  Body:
  {
	"action" : "RejectPatent",
	"patentNumber" : "001"
  }
  ```
  