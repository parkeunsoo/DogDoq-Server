exports.register = function(req, res) {
 
  var Fabric_Client = require("fabric-client");
  var Fabric_CA_Client = require("fabric-ca-client");
  var path = require("path");

  var msp;
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
  // 로컬 DB 사용 (mysql)
  var mysql = require("mysql");
  var connection = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    password: "qwer1689",
    database: "dogdoq_login_db"
  });
  // 사용자의 소속(기관)에 따라 다른 DB에 회원정보 저장 
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
      console.log("결과는:",results);
      Fabric_Client.newDefaultKeyValueStore({ path: store_path })
        .then(state_store => {
        // fabric-client의 폴더 설정
          fabric_client.setStateStore(state_store);
          var crypto_suite = Fabric_Client.newCryptoSuite();
        // fabric-client SDK가 설정해놓은 폴더에 있는 인증서 정보를 fabric_client에서 활용
          var crypto_store = Fabric_Client.newCryptoKeyStore({
            path: store_path
          });
          crypto_suite.setCryptoKeyStore(crypto_store);
          fabric_client.setCryptoSuite(crypto_suite);
          var tlsOptions = {
            trustedRoots: [],
            verify: false
          };
          // 사용자의 소속(기관)에 따라 CA에 등록할 MSP를 다르게 부여
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
          // CA 서버 관리자가 등록 됐는지 확인.
          return fabric_client.getUserContext("admin", true);
        })
        .then(user_from_store => {
          if (user_from_store && user_from_store.isEnrolled()) {
            console.log("CA 서버 관리자를 성공적으로 로드했습니다.");
            admin_user = user_from_store;
          } else {
            throw new Error("CA 서버 관리자를 등록해주세요.");
          }
          // 관리자의 권한으로 CA 서버에 회원을 등록.
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
          console.log(
            "Successfully registered " + req.body.email + "- secret:" + secret
          );
          // CA 서버에서 회원 비밀정보를 발급
          return fabric_ca_client.enroll({
            enrollmentID: req.body.email,
            enrollmentSecret: secret
          });
        })
        .then(enrollment => {
          console.log(
            "Successfully enrolled member user" + req.body.email + msp
          );
          // 비밀정보를 이용하여 회원의 저장소에 인증서 생성
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
            req.body.email+" was successfully registered and enrolled and is ready to interact with the DogDoq-Network"
          );
        })
        .catch(err => {
          console.error("Failed to register: " + err);
          if (err.toString().indexOf("Authorization") > -1) {
            console.error(
              "DogDoq-Network를 다시 실행해주세요..\n" +
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
