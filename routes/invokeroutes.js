var Fabric_Client = require("fabric-client");
var path = require("path");
var util = require("util");
var fs = require("fs");
var fabric_client = new Fabric_Client();

var tx_id = null;
var capeer1Path =
  "../dogdoq-network/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt";
let data1 = fs.readFileSync(capeer1Path);
let capeer1 = Buffer.from(data1).toString();
var peer1 = fabric_client.newPeer("grpcs://0.0.0.0:7051", {
  pem: capeer1,
  "ssl-target-name-override": "peer0.org1.example.com:7051"
});
var capeer2Path =
  "../dogdoq-network/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt";
let data2 = fs.readFileSync(capeer2Path);
let capeer2 = Buffer.from(data2).toString();
var peer2 = fabric_client.newPeer("grpcs://0.0.0.0:8051", {
  pem: capeer2,
  "ssl-target-name-override": "peer0.org2.example.com:8051"
});
var capeer3Path =
  "../dogdoq-network/crypto-config/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt";
let data3 = fs.readFileSync(capeer3Path);
let capeer3 = Buffer.from(data3).toString();
var peer3 = fabric_client.newPeer("grpcs://0.0.0.0:9051", {
  pem: capeer3,
  "ssl-target-name-override": "peer0.org3.example.com:9051"
});
var caordererPath =
  "../dogdoq-network/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem";
let dataorder = fs.readFileSync(caordererPath);
let caorderer = Buffer.from(dataorder).toString();
var order = fabric_client.newOrderer("grpcs://localhost:7050", {
  pem: caorderer,
  "ssl-target-name-override": "orderer.example.com:7050"
});
var channel;
var channel1 = fabric_client.newChannel("channel1");
var channel2 = fabric_client.newChannel("channel2");
var channel3 = fabric_client.newChannel("channel3");
var channel4 = fabric_client.newChannel("channel4");
channel1.addPeer(peer1);
channel1.addPeer(peer2);
channel2.addPeer(peer1);
channel2.addPeer(peer3);
channel3.addPeer(peer1);
channel3.addPeer(peer2);
channel3.addPeer(peer3);
channel4.addPeer(peer1);
channel1.addOrderer(order);
channel2.addOrderer(order);
channel3.addOrderer(order);
channel4.addOrderer(order);
var mysql = require("mysql");
var connection = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "qwer1689",
  database: "dogdoq_dog_db"
});
var currentmediver;
var currenthealthver;

exports.org1 = function(req, res) {
  console.log(req.body);
  if (req.body.function == "createHealthcare") {
    connection.query(
      "SELECT * FROM dog WHERE id = ?",
      [req.body.dogId],
      function(error, results, fields) {
        if (error) {
          console.error(error);
          res.send({
            code: 400,
            failed: "error ocurred"
          });
        } else {
          if (results.length > 0) {
            var healthver = results[0].healthcare + 1;
            currenthealthver = String(results[0].healthcare);
            connection.query(
              "UPDATE dog SET healthcare= ? WHERE id = ?",
              [healthver, req.body.dogId],
              function(error, results) {
                if (error) {
                  console.log("error ocurred", error);
                  res.send({
                    code: 400,
                    failed: "error ocurred"
                  });
                } else if (results.length > 0) {
                  if (results[0].medical > 0) {
                    res.send({
                      code: 200,
                      success:
                        "dog healthcare version info register sucessfull",
                      id: req.body.dogId
                    });
                  } else {
                    res.send({
                      code: 204,
                      success: "Email and password does not match",
                      id: req.body.dogId
                    });
                  }
                }
              }
            );
          }
        }
      }
    );
  }
  var store_path = path.join(__dirname, "../hfc-key-store");
  Fabric_Client.newDefaultKeyValueStore({ path: store_path })
    .then(state_store => {
      // assign the store to the fabric client
      fabric_client.setStateStore(state_store);
      var crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      var crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      // get the enrolled user from persistence, this user will sign all requests
      return fabric_client.getUserContext(req.body.email, true);
    })
    .then(user_from_store => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log(
          "Successfully loaded " + req.body.email + " from persistence"
        );
        member_user = user_from_store;
      } else {
        throw new Error(
          "Failed to get " + req.body.email + " .... run registerUser.js"
        );
      }
      var encodingValue = req.body.encodingvalue;
      var hashValue = req.body.hashvalue;
      // get a transaction id object based on the current user assigned to fabric client
      tx_id = fabric_client.newTransactionID();
      console.log("Assigning transaction_id: ", tx_id._transaction_id);

      // createCar chaincode function - requires 5 args, ex: args: ['CAR12', 'Honda', 'Accord', 'Black', 'Tom'],
      // changeCarOwner chaincode function - requires 2 args , ex: args: ['CAR10', 'Dave'],
      // must send the proposal to endorsing peers
      if (req.body.function == "createPurchase") {
        var request = {
          chaincodeId: "channel1",
          fcn: "createPurchase",
          args: [req.body.dogId, hashValue, encodingValue],
          chainId: "channel1",
          txId: tx_id
        };
        channel = channel1;
      } else if (req.body.function == "createHealthcare") {
        var request = {
          chaincodeId: "channel3",
          fcn: "createHealthcare",
          args: [
            req.body.dogId,
            hashValue,
            encodingValue,
            currenthealthver,
            req.body.date
          ],
          chainId: "channel3",
          txId: tx_id
        };
        console.log(currenthealthver);
        channel = channel3;
      } else if (req.body.function == "createSales") {
        var request = {
          chaincodeId: "channel4",
          fcn: "createSales",
          args: [req.body.dogId, hashValue, encodingValue],
          chainId: "channel4",
          txId: tx_id
        };
        channel = channel4;
      }
      // send the transaction proposal to the peers
      return channel.sendTransactionProposal(request);
    })
    .then(results => {
      var proposalResponses = results[0];
      var proposal = results[1];
      let isProposalGood = false;
      if (
        proposalResponses &&
        proposalResponses[0].response &&
        proposalResponses[0].response.status === 200
      ) {
        isProposalGood = true;
        console.log("Transaction proposal was good");
        res.send({
          code: 200,
          success: "invoke sucessfully"
        });
      } else {
        console.error(proposalResponses + "Transaction proposal was bad");
      }
      if (isProposalGood) {
        console.log(
          util.format(
            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
            proposalResponses[0].response.status,
            proposalResponses[0].response.message
          )
        );

        // build up the request for the orderer to have the transaction committed
        var request = {
          proposalResponses: proposalResponses,
          proposal: proposal
        };

        // set the transaction listener and set a timeout of 30 sec
        // if the transaction did not get committed within the timeout period,
        // report a TIMEOUT status
        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
        var promises = [];

        var sendPromise = channel.sendTransaction(request);
        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

        // get an eventhub once the fabric client has a user assigned. The user
        // is required bacause the event registration must be signed
        let event_hub = channel.newChannelEventHub(peer1);

        // using resolve the promise so that result status may be processed
        // under the then clause rather than having the catch clause process
        // the status
        let txPromise = new Promise((resolve, reject) => {
          let handle = setTimeout(() => {
            event_hub.unregisterTxEvent(transaction_id_string);
            event_hub.disconnect();
            resolve({ event_status: "TIMEOUT" }); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
          }, 3000);
          event_hub.registerTxEvent(
            transaction_id_string,
            (tx, code) => {
              // this is the callback for transaction event status
              // first some clean up of event listener
              clearTimeout(handle);

              // now let the application know what happened
              var return_status = {
                event_status: code,
                tx_id: transaction_id_string
              };
              if (code !== "VALID") {
                console.error("The transaction was invalid, code = " + code);
                resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
              } else {
                console.log(
                  "The transaction has been committed on peer " +
                    event_hub.getPeerAddr()
                );
                resolve(return_status);
              }
            },
            err => {
              //this is the callback if something goes wrong with the event registration or processing
              reject(
                new Error("There was a problem with the eventhub ::" + err)
              );
            },
            { disconnect: true } //disconnect when complete
          );
          event_hub.connect();
        });
        promises.push(txPromise);

        return Promise.all(promises);
      } else {
        console.error(
          "Failed to send Proposal or receive valid response. Response null or status is not 200. exiting..."
        );
        throw new Error(
          "Failed to send Proposal or receive valid response. Response null or status is not 200. exiting..."
        );
      }
    })
    .then(results => {
      console.log(
        "Send transaction promise and event listener promise have completed"
      );
      // check the results in the order the promises were added to the promise all list
      if (results && results[0] && results[0].status === "SUCCESS") {
        console.log("Successfully sent transaction to the orderer.");
      } else {
        console.error(
          "Failed to order the transaction. Error code: " + results[0].status
        );
      }

      if (results && results[1] && results[1].event_status === "VALID") {
        console.log(
          "Successfully committed the change to the ledger by the peer"
        );
      } else {
        console.log(
          "Transaction failed to be committed to the ledger due to ::" +
            results[1].event_status
        );
      }
    })
    .catch(err => {
      console.error("Failed to invoke successfully :: " + err);
      res.send({
        code: 400,
        failed: "error ocurred"
      });
    });
};
exports.org2 = function(req, res) {
  var store_path = path.join(__dirname, "../hfc-key-store2");
  Fabric_Client.newDefaultKeyValueStore({ path: store_path })
    .then(state_store => {
      // assign the store to the fabric client
      fabric_client.setStateStore(state_store);
      var crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      var crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      // get the enrolled user from persistence, this user will sign all requests
      return fabric_client.getUserContext(req.body.email, true);
    })
    .then(user_from_store => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log(
          "Successfully loaded " + req.body.email + " from persistence"
        );
        member_user = user_from_store;
      } else {
        throw new Error(
          "Failed to get " + req.body.email + " .... run registerUser.js"
        );
      }
      var encodingValue = req.body.encodingvalue;
      var hashValue = req.body.hashvalue;
      // get a transaction id object based on the current user assigned to fabric client
      tx_id = fabric_client.newTransactionID();
      console.log("Assigning transaction_id: ", tx_id._transaction_id);

      // createCar chaincode function - requires 5 args, ex: args: ['CAR12', 'Honda', 'Accord', 'Black', 'Tom'],
      // changeCarOwner chaincode function - requires 2 args , ex: args: ['CAR10', 'Dave'],
      // must send the proposal to endorsing peers
      if (req.body.function == "createSales") {
        var request = {
          //targets: let default to the peer assigned to the client
          chaincodeId: "channel1",
          fcn: "createSales",
          args: [req.body.dogId, hashValue, encodingValue],
          chainId: "channel1",
          txId: tx_id
        };
        channel = channel1;
      } else if (req.body.function == "createBloodline") {
        var request = {
          chaincodeId: "channel3",
          fcn: "createBloodline",
          args: [req.body.dogId, hashValue, encodingValue, req.body.date],
          chainId: "channel3",
          txId: tx_id
        };
        channel = channel3;
      }
      // send the transaction proposal to the peers
      return channel.sendTransactionProposal(request);
    })
    .then(results => {
      var proposalResponses = results[0];
      var proposal = results[1];
      let isProposalGood = false;
      if (
        proposalResponses &&
        proposalResponses[0].response &&
        proposalResponses[0].response.status === 200
      ) {
        isProposalGood = true;
        console.log("Transaction proposal was good");
        res.send({
          code: 200,
          success: "invoke sucessfully"
        });
      } else {
        console.error(proposalResponses + "Transaction proposal was bad");
      }
      if (isProposalGood) {
        console.log(
          util.format(
            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
            proposalResponses[0].response.status,
            proposalResponses[0].response.message
          )
        );

        // build up the request for the orderer to have the transaction committed
        var request = {
          proposalResponses: proposalResponses,
          proposal: proposal
        };

        // set the transaction listener and set a timeout of 30 sec
        // if the transaction did not get committed within the timeout period,
        // report a TIMEOUT status
        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
        var promises = [];

        var sendPromise = channel.sendTransaction(request);
        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

        // get an eventhub once the fabric client has a user assigned. The user
        // is required bacause the event registration must be signed
        let event_hub = channel.newChannelEventHub(peer2);

        // using resolve the promise so that result status may be processed
        // under the then clause rather than having the catch clause process
        // the status
        let txPromise = new Promise((resolve, reject) => {
          let handle = setTimeout(() => {
            event_hub.unregisterTxEvent(transaction_id_string);
            event_hub.disconnect();
            resolve({ event_status: "TIMEOUT" }); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
          }, 3000);
          event_hub.registerTxEvent(
            transaction_id_string,
            (tx, code) => {
              // this is the callback for transaction event status
              // first some clean up of event listener
              clearTimeout(handle);

              // now let the application know what happened
              var return_status = {
                event_status: code,
                tx_id: transaction_id_string
              };
              if (code !== "VALID") {
                console.error("The transaction was invalid, code = " + code);
                resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
              } else {
                console.log(
                  "The transaction has been committed on peer " +
                    event_hub.getPeerAddr()
                );
                resolve(return_status);
              }
            },
            err => {
              //this is the callback if something goes wrong with the event registration or processing
              reject(
                new Error("There was a problem with the eventhub ::" + err)
              );
            },
            { disconnect: true } //disconnect when complete
          );
          event_hub.connect();
        });
        promises.push(txPromise);

        return Promise.all(promises);
      } else {
        console.error(
          "Failed to send Proposal or receive valid response. Response null or status is not 200. exiting..."
        );
        throw new Error(
          "Failed to send Proposal or receive valid response. Response null or status is not 200. exiting..."
        );
      }
    })
    .then(results => {
      console.log(
        "Send transaction promise and event listener promise have completed"
      );
      // check the results in the order the promises were added to the promise all list
      if (results && results[0] && results[0].status === "SUCCESS") {
        console.log("Successfully sent transaction to the orderer.");
      } else {
        console.error(
          "Failed to order the transaction. Error code: " + results[0].status
        );
      }

      if (results && results[1] && results[1].event_status === "VALID") {
        console.log(
          "Successfully committed the change to the ledger by the peer"
        );
      } else {
        console.log(
          "Transaction failed to be committed to the ledger due to ::" +
            results[1].event_status
        );
      }
    })
    .catch(err => {
      console.error("Failed to invoke successfully :: " + err);
      res.send({
        code: 400,
        failed: "error ocurred"
      });
    });
};

exports.org3 = function(req, res) {
  console.log(req.body);
  if (req.body.function == "createDiagnostic") {
    connection.query(
      "SELECT * FROM dog WHERE id = ?",
      [req.body.dogId],
      function(error, results, fields) {
        if (error) {
          console.error(error);
          res.send({
            code: 400,
            failed: "error ocurred"
          });
        } else {
          if (results.length > 0) {
            var medicalver = results[0].medical + 1;
            currentmediver = String(results[0].medical);
            connection.query(
              "UPDATE dog SET medical= ? WHERE id = ?",
              [medicalver, req.body.dogId],
              function(error, results) {
                if (error) {
                  console.log("error ocurred", error);
                  res.send({
                    code: 400,
                    failed: "error ocurred"
                  });
                } else if (results.length > 0) {
                  if (results[0].medical > 0) {
                    res.send({
                      code: 200,
                      success:
                        "dog healthcare version info register sucessfull",
                      id: req.body.dogId
                    });
                  } else {
                    res.send({
                      code: 204,
                      success: "Email and password does not match",
                      id: req.body.dogId
                    });
                  }
                }
              }
            );
          }
        }
      }
    );
  }
  var store_path = path.join(__dirname, "../hfc-key-store3");
  Fabric_Client.newDefaultKeyValueStore({ path: store_path })
    .then(state_store => {
      // assign the store to the fabric client
      fabric_client.setStateStore(state_store);
      var crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      var crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      // get the enrolled user from persistence, this user will sign all requests
      return fabric_client.getUserContext(req.body.email, true);
    })
    .then(user_from_store => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log(
          "Successfully loaded " + req.body.email + " from persistence"
        );
        member_user = user_from_store;
      } else {
        throw new Error(
          "Failed to get " + req.body.email + " .... run registerUser.js"
        );
      }
      var encodingValue = req.body.encodingvalue;
      var hashValue = req.body.hashvalue;

      // get a transaction id object based on the current user assigned to fabric client
      tx_id = fabric_client.newTransactionID();
      console.log("Assigning transaction_id: ", tx_id._transaction_id);

      // createCar chaincode function - requires 5 args, ex: args: ['CAR12', 'Honda', 'Accord', 'Black', 'Tom'],
      // changeCarOwner chaincode function - requires 2 args , ex: args: ['CAR10', 'Dave'],
      // must send the proposal to endorsing peers
      if (req.body.function == "createReceipt") {
        var request = {
          //targets: let default to the peer assigned to the client
          chaincodeId: "channel2",
          fcn: "createReceipt",
          args: [req.body.dogId, hashValue, encodingValue],
          chainId: "channel2",
          txId: tx_id
        };
        channel = channel2;
      } else if (req.body.function == "createDiagnostic") {
        var request = {
          chaincodeId: "channel3",
          fcn: "createDiagnostic",
          args: [
            req.body.dogId,
            hashValue,
            encodingValue,
            currentmediver,
            req.body.date
          ],
          chainId: "channel3",
          txId: tx_id
        };
        channel = channel3;
      }
      // send the transaction proposal to the peers
      return channel.sendTransactionProposal(request);
    })
    .then(results => {
      var proposalResponses = results[0];
      var proposal = results[1];
      let isProposalGood = false;
      if (
        proposalResponses &&
        proposalResponses[0].response &&
        proposalResponses[0].response.status === 200
      ) {
        isProposalGood = true;
        console.log("Transaction proposal was good");
        res.send({
          code: 200,
          success: "invoke sucessfully"
        });
      } else {
        console.error(proposalResponses + "Transaction proposal was bad");
      }
      if (isProposalGood) {
        console.log(
          util.format(
            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
            proposalResponses[0].response.status,
            proposalResponses[0].response.message
          )
        );

        // build up the request for the orderer to have the transaction committed
        var request = {
          proposalResponses: proposalResponses,
          proposal: proposal
        };

        // set the transaction listener and set a timeout of 30 sec
        // if the transaction did not get committed within the timeout period,
        // report a TIMEOUT status
        var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
        var promises = [];

        var sendPromise = channel.sendTransaction(request);
        promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

        // get an eventhub once the fabric client has a user assigned. The user
        // is required bacause the event registration must be signed
        let event_hub = channel.newChannelEventHub(peer3);

        // using resolve the promise so that result status may be processed
        // under the then clause rather than having the catch clause process
        // the status
        let txPromise = new Promise((resolve, reject) => {
          let handle = setTimeout(() => {
            event_hub.unregisterTxEvent(transaction_id_string);
            event_hub.disconnect();
            resolve({ event_status: "TIMEOUT" }); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
          }, 3000);
          event_hub.registerTxEvent(
            transaction_id_string,
            (tx, code) => {
              // this is the callback for transaction event status
              // first some clean up of event listener
              clearTimeout(handle);

              // now let the application know what happened
              var return_status = {
                event_status: code,
                tx_id: transaction_id_string
              };
              if (code !== "VALID") {
                console.error("The transaction was invalid, code = " + code);
                resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
              } else {
                console.log(
                  "The transaction has been committed on peer " +
                    event_hub.getPeerAddr()
                );
                resolve(return_status);
              }
            },
            err => {
              //this is the callback if something goes wrong with the event registration or processing
              reject(
                new Error("There was a problem with the eventhub ::" + err)
              );
            },
            { disconnect: true } //disconnect when complete
          );
          event_hub.connect();
        });
        promises.push(txPromise);

        return Promise.all(promises);
      } else {
        console.error(
          "Failed to send Proposal or receive valid response. Response null or status is not 200. exiting..."
        );
        throw new Error(
          "Failed to send Proposal or receive valid response. Response null or status is not 200. exiting..."
        );
      }
    })
    .then(results => {
      console.log(
        "Send transaction promise and event listener promise have completed"
      );
      // check the results in the order the promises were added to the promise all list
      if (results && results[0] && results[0].status === "SUCCESS") {
        console.log("Successfully sent transaction to the orderer.");
      } else {
        console.error(
          "Failed to order the transaction. Error code: " + results[0].status
        );
      }

      if (results && results[1] && results[1].event_status === "VALID") {
        console.log(
          "Successfully committed the change to the ledger by the peer"
        );
      } else {
        console.log(
          "Transaction failed to be committed to the ledger due to ::" +
            results[1].event_status
        );
      }
    })
    .catch(err => {
      console.error("Failed to invoke successfully :: " + err);
      res.send({
        code: 400,
        failed: "error ocurred"
      });
    });
};
