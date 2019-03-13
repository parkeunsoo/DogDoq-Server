var Fabric_Client = require("fabric-client");
var path = require("path");
var fs = require("fs");

var fabric_client = new Fabric_Client();
var capeer1Path =
  "../DogDoq-Network/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt";
let data1 = fs.readFileSync(capeer1Path);
let capeer1 = Buffer.from(data1).toString();
var peer1 = fabric_client.newPeer("grpcs://0.0.0.0:7051", {
  pem: capeer1,
  "ssl-target-name-override": "peer0.org1.example.com:7051"
});
var capeer2Path =
  "../DogDoq-Network/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt";
let data2 = fs.readFileSync(capeer2Path);
let capeer2 = Buffer.from(data2).toString();
var peer2 = fabric_client.newPeer("grpcs://0.0.0.0:8051", {
  pem: capeer2,
  "ssl-target-name-override": "peer0.org2.example.com:8051"
});
var capeer3Path =
  "../DogDoq-Network/crypto-config/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt";
let data3 = fs.readFileSync(capeer3Path);
let capeer3 = Buffer.from(data3).toString();
var peer3 = fabric_client.newPeer("grpcs://0.0.0.0:9051", {
  pem: capeer3,
  "ssl-target-name-override": "peer0.org3.example.com:9051"
});
var capeer4Path =
  "../DogDoq-Network/crypto-config/peerOrganizations/org4.example.com/peers/peer0.org4.example.com/tls/ca.crt";
let data4 = fs.readFileSync(capeer4Path);
let capeer4 = Buffer.from(data4).toString();
var peer4 = fabric_client.newPeer("grpcs://0.0.0.0:10051", {
  pem: capeer4,
  "ssl-target-name-override": "peer0.org4.example.com:10051"
});
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
channel3.addPeer(peer4);
channel4.addPeer(peer1);
channel4.addPeer(peer4);

var mysql = require("mysql");
var connection = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "qwer1689",
  database: "dogdoq_dog_db"
});

var healthver;
var medicalver;
exports.org1 = function(req, res) {
  connection.query("SELECT * FROM dog WHERE id = ?", [req.body.dogId], function(
    error,
    results,
    fields
  ) {
    if (error) {
      // console.log("error ocurred", error);
      console.error(error);
      res.send({
        code: 400,
        failed: "error ocurred"
      });
    } else {
      // console.log('The solution is: ', results);
      if (results.length > 0) {
        medicalver = String(results[0].medical);
        healthver = String(results[0].healthcare);
      }
    }
  });
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

      if (req.body.function == "querySales") {
        var request = {
          chaincodeId: "channel4",
          fcn: "querySales",
          args: [req.body.dogId]
        };
        channel = channel4;
      } else if (req.body.function == "queryPurchase") {
        var request = {
          chaincodeId: "channel1",
          fcn: "queryPurchase",
          args: [req.body.dogId]
        };
        channel = channel1;
      } else if (req.body.function == "queryReceipt") {
        var request = {
          chaincodeId: "channel2",
          fcn: "queryReceipt",
          args: [req.body.dogId]
        };
        channel = channel2;
      } else if (req.body.function == "queryHealthcare") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryHealthcare",
          args: [req.body.dogId]
        };
        channel = channel3;
      } else if (req.body.function == "queryBloodline") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryBloodline",
          args: [req.body.dogId]
        };
        channel = channel3;
      } else if (req.body.function == "queryDiagnostic") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryDiagnostic",
          args: [req.body.dogId]
        };
        channel = channel3;
      } else if (req.body.function == "queryAllDiagnostic") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryAllDiagnostic",
          args: [req.body.dogId, medicalver]
        };
        channel = channel3;
      } else if (req.body.function == "queryAllHealthcare") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryAllHealthcare",
          args: [req.body.dogId, healthver]
        };
        channel = channel3;
      }

      // send the query proposal to the peer
      return channel.queryByChaincode(request);
    })
    .then(query_responses => {
      console.log("Query has completed, checking results");

      // query_responses could have more than one  results if there multiple peers were used as targets
      if (query_responses) {
        if (query_responses[0] instanceof Error) {
          console.error("error from query = ", query_responses[0]);
        } else {
          console.log("Response is ", query_responses[0].toString());
          res.send({
            code: 200,
            success: "query completed sucessfully",
            result: query_responses[0].toString()
          });
        }
      } else {
        console.log("No payloads were returned from query");
      }
    })
    .catch(err => {
      console.error("Failed to query successfully :: " + err);
    });
};

exports.org2 = function(req, res) {
  connection.query("SELECT * FROM dog WHERE id = ?", [req.body.dogId], function(
    error,
    results,
    fields
  ) {
    if (error) {
      // console.log("error ocurred", error);
      console.error(error);
      res.send({
        code: 400,
        failed: "error ocurred"
      });
    } else {
      // console.log('The solution is: ', results);
      if (results.length > 0) {
        medicalver = String(results[0].medical);
        healthver = String(results[0].healthcare);
      }
    }
  });
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
          "Failed to get " + req.body.email + ".... run registerUser.js"
        );
      }
      if (req.body.function == "querySales") {
        var request = {
          chaincodeId: "channel1",
          fcn: "querySales",
          args: [req.body.dogId]
        };
        channel = channel1;
      } else if (req.body.function == "queryPurchase") {
        var request = {
          chaincodeId: "channel1",
          fcn: "queryPurchase",
          args: [req.body.dogId]
        };
        channel = channel1;
      } else if (req.body.function == "queryHealthcare") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryHealthcare",
          args: [req.body.dogId, healthcare]
        };
        channel = channel3;
      } else if (req.body.function == "queryBloodline") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryBloodline",
          args: [req.body.dogId]
        };
        channel = channel3;
      } else if (req.body.function == "queryDiagnostic") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryDiagnostic",
          args: [req.body.dogId, medicalver]
        };
        channel = channel3;
      } else if (req.body.function == "queryAllDiagnostic") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryAllDiagnostic",
          args: [req.body.dogId, medicalver]
        };
        channel = channel3;
      } else if (req.body.function == "queryAllHealthcare") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryAllHealthcare",
          args: [req.body.dogId, healthver]
        };
        channel = channel3;
      }
      // send the query proposal to the peer
      return channel.queryByChaincode(request);
    })
    .then(query_responses => {
      console.log("Query has completed, checking results");
      console.log(query_responses);

      // query_responses could have more than one  results if there multiple peers were used as targets
      if (query_responses) {
        if (query_responses[0] instanceof Error) {
          console.error("error from query = ", query_responses[0]);
        } else {
          console.log("Response is ", query_responses[0].toString());
          res.send({
            code: 200,
            success: "query completed sucessfully",
            result: query_responses[0].toString()
          });
        }
      } else {
        console.log("No payloads were returned from query");
      }
    })
    .catch(err => {
      console.error("Failed to query successfully :: " + err);
    });
};

exports.org3 = function(req, res) {
  connection.query("SELECT * FROM dog WHERE id = ?", [req.body.dogId], function(
    error,
    results,
    fields
  ) {
    if (error) {
      // console.log("error ocurred", error);
      console.error(error);
      res.send({
        code: 400,
        failed: "error ocurred"
      });
    } else {
      // console.log('The solution is: ', results);
      if (results.length > 0) {
        medicalver = String(results[0].medical);
        healthver = String(results[0].healthcare);
      }
    }
  });
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
          "Successfully loaded " + req.body.email + "from persistence"
        );
        member_user = user_from_store;
      } else {
        throw new Error(
          "Failed to get " + req.body.email + " .... run registerUser.js"
        );
      }

      if (req.body.function == "queryReceipt") {
        var request = {
          chaincodeId: "channel2",
          fcn: "queryReceipt",
          args: [req.body.dogId]
        };
        channel = channel2;
      } else if (req.body.function == "queryHealthcare") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryHealthcare",
          args: [req.body.dogId]
        };
        channel = channel3;
      } else if (req.body.function == "queryBloodline") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryBloodline",
          args: [req.body.dogId]
        };
        channel = channel3;
      } else if (req.body.function == "queryDiagnostic") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryDiagnostic",
          args: [req.body.dogId, medicalver]
        };
        channel = channel3;
      } else if (req.body.function == "queryAllDiagnostic") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryAllDiagnostic",
          args: [req.body.dogId, medicalver]
        };
        channel = channel3;
      } else if (req.body.function == "queryAllHealthcare") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryAllHealthcare",
          args: [req.body.dogId, healthver]
        };
        channel = channel3;
      }
      // send the query proposal to the peer
      return channel.queryByChaincode(request);
    })
    .then(query_responses => {
      console.log("Query has completed, checking results");

      // query_responses could have more than one  results if there multiple peers were used as targets
      if (query_responses) {
        if (query_responses[0] instanceof Error) {
          console.error("error from query = ", query_responses[0]);
        } else {
          console.log("Response is ", query_responses[0].toString());
          res.send({
            code: 200,
            success: "query completed sucessfully",
            result: query_responses[0].toString()
          });
        }
      } else {
        console.log("No payloads were returned from query");
      }
    })
    .catch(err => {
      console.error("Failed to query successfully :: " + err);
    });
};

exports.org4 = function(req, res) {
  connection.query("SELECT * FROM dog WHERE id = ?", [req.body.dogId], function(
    error,
    results,
    fields
  ) {
    if (error) {
      // console.log("error ocurred", error);
      console.error(error);
      res.send({
        code: 400,
        failed: "error ocurred"
      });
    } else {
      // console.log('The solution is: ', results);
      if (results.length > 0) {
        medicalver = String(results[0].medical);
        healthver = String(results[0].healthcare);
      }
    }
  });
  var store_path = path.join(__dirname, "../hfc-key-store4");
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

      if (req.body.function == "queryHealthcare") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryHealthcare",
          args: [req.body.dogId, healthver]
        };
        channel = channel3;
      } else if (req.body.function == "queryBloodline") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryBloodline",
          args: [req.body.dogId]
        };
        channel = channel3;
      } else if (req.body.function == "queryDiagnostic") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryDiagnostic",
          args: [req.body.dogId, medicalver]
        };
        channel = channel3;
      } else if (req.body.function == "queryAllDiagnostic") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryAllDiagnostic",
          args: [req.body.dogId, medicalver]
        };
        channel = channel3;
      } else if (req.body.function == "queryAllHealthcare") {
        var request = {
          chaincodeId: "channel3",
          fcn: "queryAllHealthcare",
          args: [req.body.dogId, healthver]
        };
        channel = channel3;
      } else if (req.body.function == "querySales") {
        var request = {
          chaincodeId: "channel4",
          fcn: "querySales",
          args: [req.body.dogId]
        };
        channel = channel4;
      }
      // send the query proposal to the peer
      return channel.queryByChaincode(request);
    })
    .then(query_responses => {
      console.log("Query has completed, checking results");

      // query_responses could have more than one  results if there multiple peers were used as targets
      if (query_responses) {
        if (query_responses[0] instanceof Error) {
          console.error("error from query = ", query_responses[0]);
        } else {
          console.log("Response is ", query_responses[0].toString());
          res.send({
            code: 200,
            success: "query completed sucessfully",
            result: query_responses[0].toString()
          });
        }
      } else {
        console.log("No payloads were returned from query");
      }
    })
    .catch(err => {
      console.error("Failed to query successfully :: " + err);
    });
};
