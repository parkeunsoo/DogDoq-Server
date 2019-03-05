exports.register = function(req, res) {
  console.log("req", req.body);
  var msp;
  var Fabric_Client = require("fabric-client");
  var Fabric_CA_Client = require("fabric-ca-client");
  var path = require("path");
  var util = require("util");
  var os = require("os");
  if (req.body.kind == "user4") {
    var users = {
      email: req.body.email,
      password: req.body.password
    };
    msp = "Org4MSP";
    var store_path = path.join(__dirname, "../hfc-key-store4");
  } else {
    var users = {
      email: req.body.email,
      password: req.body.password,
      ipaddress: req.body.ipaddress
    };
    if (req.body.kind == "user1") {
      msp = "Org1MSP";
      var store_path = path.join(__dirname, "../hfc-key-store");
    } else if (req.body.kind == "user2") {
      msp = "Org2MSP";
      var store_path = path.join(__dirname, "../hfc-key-store2");
    } else if (req.body.kind == "user3") {
      msp = "Org3MSP";
      var store_path = path.join(__dirname, "../hfc-key-store3");
    }
  }

  var fabric_client = new Fabric_Client();
  var fabric_ca_client = null;
  var admin_user = null;
  var member_user = null;
  var mysql = require("mysql");
  var connection = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "qwer1689",
    database: "dogdoq_login_db"
  });
  connection.query("INSERT INTO " + req.body.kind + " SET ?", users, function(
    error,
    results
  ) {
    if (error) {
      console.log("error ocurred", error);
      res.send({
        code: 400,
        failed: "error ocurred"
      });
    } else {
      console.log("The solution is: ", results);
      Fabric_Client.newDefaultKeyValueStore({ path: store_path })
        .then(state_store => {
          // assign the store to the fabric client
          fabric_client.setStateStore(state_store);
          var crypto_suite = Fabric_Client.newCryptoSuite();
          // use the same location for the state store (where the users' certificate are kept)
          // and the crypto store (where the users' keys are kept)
          var crypto_store = Fabric_Client.newCryptoKeyStore({
            path: store_path
          });
          crypto_suite.setCryptoKeyStore(crypto_store);
          fabric_client.setCryptoSuite(crypto_suite);
          var tlsOptions = {
            trustedRoots: [],
            verify: false
          };
          // be sure to change the http to https when the CA is running TLS enabled
          if (msp == "Org1MSP") {
            fabric_ca_client = new Fabric_CA_Client(
              "https://localhost:7054",
              null,
              "",
              crypto_suite
            );
          } else if (msp == "Org2MSP") {
            fabric_ca_client = new Fabric_CA_Client(
              "https://localhost:8054",
              null,
              "",
              crypto_suite
            );
          } else if (msp == "Org3MSP") {
            fabric_ca_client = new Fabric_CA_Client(
              "https://localhost:9054",
              null,
              "",
              crypto_suite
            );
          } else if (msp == "Org4MSP") {
            fabric_ca_client = new Fabric_CA_Client(
              "https://localhost:10054",
              null,
              "",
              crypto_suite
            );
          }
          // first check to see if the admin is already enrolled
          return fabric_client.getUserContext("admin", true);
        })
        .then(user_from_store => {
          if (user_from_store && user_from_store.isEnrolled()) {
            console.log("Successfully loaded admin from persistence");
            admin_user = user_from_store;
          } else {
            throw new Error("Failed to get admin.... run enrollAdmin.js");
          }

          // at this point we should have the admin user
          // first need to register the user with the CA server
          return fabric_ca_client.register(
            {
              enrollmentID: req.body.email,
              affiliation: "",
              role: "client"
            },
            admin_user
          );
        })
        .then(secret => {
          // next we need to enroll the user with CA server
          console.log(
            "Successfully registered " + req.body.email + "- secret:" + secret
          );

          return fabric_ca_client.enroll({
            enrollmentID: req.body.email,
            enrollmentSecret: secret
          });
        })
        .then(enrollment => {
          console.log(
            "Successfully enrolled member user" + req.body.email + msp
          );
          return fabric_client.createUser({
            username: req.body.email,
            mspid: msp,
            cryptoContent: {
              privateKeyPEM: enrollment.key.toBytes(),
              signedCertPEM: enrollment.certificate
            }
          });
        })
        .then(user => {
          member_user = user;

          return fabric_client.setUserContext(member_user);
        })
        .then(() => {
          console.log(
            req.body.email+" was successfully registered and enrolled and is ready to interact with the fabric network"
          );
        })
        .catch(err => {
          console.error("Failed to register: " + err);
          if (err.toString().indexOf("Authorization") > -1) {
            console.error(
              "Authorization failures may be caused by having admin credentials from a previous CA instance.\n" +
                "Try again after deleting the contents of the store directory " +
                store_path
            );
          }
        });
      res.send({
        code: 200,
        success: "user registered sucessfully"
      });
    }
  });
};

exports.login = function(req, res) {
  var email = req.body.email;
  var password = req.body.password;

  var mysql = require("mysql");
  var connection = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "qwer1689",
    database: "dogdoq_login_db"
  });
  connection.query(
    "SELECT * FROM " + req.body.kind + " WHERE email = ?",
    [email],
    function(error, results, fields) {
      if (error) {
        console.error(error);
        res.send({
          code: 400,
          failed: "error ocurred"
        });
      } else {
        if (results.length > 0) {
          if (results[0].password == password) {
            res.send({
              code: 200,
              success: "login sucessfull",
              id: email
            });
          } else {
            res.send({
              code: 204,
              success: "Email and password does not match"
            });
          }
        } else {
          res.send({
            code: 204,
            success: "Email does not exists"
          });
        }
      }
    }
  );
};

exports.dogregister = function(req, res) {
  var mysql = require("mysql");
  var connection = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "qwer1689",
    database: "dogdoq_dog_db"
  });

  var dogs = {
    id: req.body.dogId,
    medical: 0,
    healthcare: 0,
    email: "미분양"
  };
  connection.query("INSERT INTO dog SET ?", dogs, function(error, results) {
    if (error) {
      console.log("error ocurred", error);
      res.send({
        code: 400,
        failed: "error ocurred"
      });
    } else {
      res.send({
        code: 200,
        success: "dog register sucessfull"
      });
    }
  });
};
exports.ownerregister = function(req, res) {
  var mysql = require("mysql");
  var connection = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "qwer1689",
    database: "dogdoq_dog_db"
  });
  var connection2 = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "qwer1689",
    database: "dogdoq_login_db"
  });
  connection2.query(
    "SELECT * FROM user4 WHERE email = ?",
    [req.body.owner],
    function(error, results, fields) {
      if (error) {
        console.error(error);
        res.send({
          code: 400,
          failed: "error ocurred"
        });
      } else {
        if (results.length > 0) {
          connection.query(
            "UPDATE dog SET email= ? WHERE id = ?",
            [req.body.owner, req.body.dogId],
            function(error, results) {
              if (error) {
                console.log("error ocurred", error);
                res.send({
                  code: 400,
                  failed: "error ocurred"
                });
              } else {
                if (results.affectedRows > 0) {
                  res.send({
                    code: 200,
                    success:
                      "owner" +
                      req.body.owner +
                      "dog" +
                      req.body.dogId +
                      "register sucessfull"
                  });
                } else {
                  res.send({
                    code: 400,
                    failed: "등록된 강아지가 아닙니다."
                  });
                }
              }
            }
          );
        } else {
          res.send({
            code: 400,
            failed: "등록된 사용자가 없습니다."
          });
        }
      }
    }
  );
};
exports.mydog = function(req, res) {
  var mysql = require("mysql");
  var connection = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "qwer1689",
    database: "dogdoq_dog_db"
  });
  connection.query(
    "SELECT * FROM dog WHERE email= ?",
    [req.body.email],
    function(error, results) {
      if (error) {
        console.log("error ocurred", error);
        res.send({
          code: 400,
          failed: "error ocurred"
        });
      } else {
        res.send({
          code: 200,
          success: "dog register sucessfull",
          result: results
        });
      }
    }
  );
};
exports.alldog = function(req, res) {
  var mysql = require("mysql");
  var connection = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "qwer1689",
    database: "dogdoq_dog_db"
  });
  connection.query("SELECT * FROM dog;", function(error, results) {
    if (error) {
      console.log("error ocurred", error);
      res.send({
        code: 400,
        failed: "error ocurred"
      });
    } else {
      res.send({
        code: 200,
        success: "dog register sucessfull",
        result: results
      });
    }
  });
};
