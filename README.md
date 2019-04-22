
## 1. Install IBM Blockchain extension on VSCode
a. Open VScode inside contract folder  
b. Package the smart contract globalPatent.js  
c. Install the chaincode  
d. Instantiate the chaincode  

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
  Post:
  http://localhost:6001/setup/autoLoad  

Get Blockchain  
  Post:
  http://localhost:6001/fabric/getBlockchain  

Add Member  
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
  Post:
  http://localhost:6001/fabric/admin/getMembers  
  ```bash
  Body:
  {
  	"registry": "Owner"
  }
  ```  

Get Assets  
  Post: 
  http://localhost:6001/fabric/admin/getAssets  
