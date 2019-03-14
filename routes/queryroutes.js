//Fabric SDK와 파일 경로 설정을 위해 필요한 node module
var Fabric_Client = require("fabric-client");
var path = require("path");
var fs = require("fs");
var fabric_client = new Fabric_Client();

// 각 피어의 생성과 노드간 TLS통신을 위한 피어의 TLS인증서 경로설정
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

// 채널 4개 생성
var channel1 = fabric_client.newChannel("channel1");
var channel2 = fabric_client.newChannel("channel2");
var channel3 = fabric_client.newChannel("channel3");
var channel4 = fabric_client.newChannel("channel4");

// 채널에 피어 4개의 각 채널 가입, 오더러의 각 채널 참여
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

// 로컬 데이터베이스와 연결
var mysql = require("mysql");
var connection = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "qwer1689",
  database: "dogdoq_dog_db"
});

// 강아지의 현재 문서버전을 할당할 변수 선언
var healthver;
var medicalver;

// 펫샵 query
exports.org1 = function(req, res) {
  connection.query("SELECT * FROM dog WHERE id = ?", [req.body.dogId], function(
    error,
    results,
    fields
  ) {
    if (error) {
      console.error(error);
      res.send({
        code: 400,
        failed: "error ocurred"
      });
    } else {
      if (results.length > 0) {
        medicalver = String(results[0].medical);
        healthver = String(results[0].healthcare);
      }
    }
  });
  var store_path = path.join(__dirname, "../인증서_펫샵");
  Fabric_Client.newDefaultKeyValueStore({ path: store_path })
    .then(state_store => {
      // fabric_client의 폴더 설정
      fabric_client.setStateStore(state_store);
      var crypto_suite = Fabric_Client.newCryptoSuite();

      // fabric_client SDK가 설정해놓은 폴더에 있는 인증서 정보를 fabric_client에서 활용
      var crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      // 유저에 대한 인증서 정보가 있다면 request에 sign을 함
      return fabric_client.getUserContext(req.body.email, true);
    })
    .then(user_from_store => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log(
          req.body.email+" 님의 정보가 인증되었습니다." 
        );
        member_user = user_from_store;
      } else {
        throw new Error(
          "펫샵의 회원이 아닙니다."
        );
      }
      // 사용자의 요청(req.body.function)에 따라 Transaction에 담을 request 객체 생성
      // 요청에 따라 채널과 체인코드가 다르게 설정됨.
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

      // 연결된 peer에게 쿼리 요청 전달.
      return channel.queryByChaincode(request);
    })
    .then(query_responses => {
      console.log("쿼리에 성공하셨습니다. 결과를 확인하세요");

      // 쿼리에 대한 응답.
      if (query_responses) {
        if (query_responses[0] instanceof Error) {
          console.error("쿼리에 에러가 발생했습니다. = ", query_responses[0]);
        } else {
          console.log("쿼리에 대한 응답:  ", query_responses[0].toString());
          res.send({
            code: 200,
            success: "query completed sucessfully",
            result: query_responses[0].toString()
          });
        }
      } else {
        console.log("요청하신 데이터가 존재하지 않습니다.");
      }
    })
    .catch(err => {
      console.error("쿼리에 실패하였습니다. :: " + err);
    });
};
// 농장 query
exports.org2 = function(req, res) {
  connection.query("SELECT * FROM dog WHERE id = ?", [req.body.dogId], function(
    error,
    results,
    fields
  ) {
    if (error) {
      console.error(error);
      res.send({
        code: 400,
        failed: "error ocurred"
      });
    } else {
      if (results.length > 0) {
        medicalver = String(results[0].medical);
        healthver = String(results[0].healthcare);
      }
    }
  });
  var store_path = path.join(__dirname, "../인증서_농장");
  Fabric_Client.newDefaultKeyValueStore({ path: store_path })
    .then(state_store => {
      // fabric-client의 폴더 설정
      fabric_client.setStateStore(state_store);
      var crypto_suite = Fabric_Client.newCryptoSuite();

      // fabric-client SDK가 설정해놓은 폴더에 있는 인증서 정보를 fabric_client에서 활용
      var crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      // 유저에 대한 인증서 정보가 있다면 request에 sign을 함. 
      return fabric_client.getUserContext(req.body.email, true);
    })
    .then(user_from_store => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log(
          req.body.email+" 님의 정보가 인증되었습니다." 
        );
        member_user = user_from_store;
      } else {
        throw new Error(
          "농장의 회원이 아닙니다."
        );
      }
      // 사용자의 요청(req.body.function)에 따라 Transaction에 담을 request 객체 생성
      // 요청에 따라 채널과 체인코드가 다르게 설정됨.
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
     // 연결된 peer에게 쿼리 요청 전달
      return channel.queryByChaincode(request);
    })
    .then(query_responses => {
      console.log("쿼리에 성공하셨습니다. 결과를 확인하세요");

      // 쿼리에 대한 응답.
      if (query_responses) {
        if (query_responses[0] instanceof Error) {
          console.error("쿼리에 에러가 발생했습니다. = ", query_responses[0]);
        } else {
          console.log("쿼리에 대한 응답: ", query_responses[0].toString());
          res.send({
            code: 200,
            success: "query completed sucessfully",
            result: query_responses[0].toString()
          });
        }
      } else {
        console.log("요청하신 데이터가 존재하지 않습니다.");
      }
    })
    .catch(err => {
      console.error("쿼리에 실패하였습니다. :: " + err);
    });
};
// 병원 query
exports.org3 = function(req, res) {
  connection.query("SELECT * FROM dog WHERE id = ?", [req.body.dogId], function(
    error,
    results,
    fields
  ) {
    if (error) {
      console.error(error);
      res.send({
        code: 400,
        failed: "error ocurred"
      });
    } else {
      if (results.length > 0) {
        medicalver = String(results[0].medical);
        healthver = String(results[0].healthcare);
      }
    }
  });
  var store_path = path.join(__dirname, "../인증서_병원");
  Fabric_Client.newDefaultKeyValueStore({ path: store_path })
    .then(state_store => {
      // fabric-client의 폴더 설정
      fabric_client.setStateStore(state_store);
      var crypto_suite = Fabric_Client.newCryptoSuite();
      
      // fabric-client SDK가 설정해놓은 폴더에 있는 인증서 정보를 fabric_client에서 활용
      var crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      // 유저에 대한 인증서 정보가 있다면 request에 sign을 함 
      return fabric_client.getUserContext(req.body.email, true);
    })
    .then(user_from_store => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log(
          req.body.email+" 님의 정보가 인증되었습니다." 
        );
        member_user = user_from_store;
      } else {
        throw new Error(
          "병원의 회원이 아닙니다."
        );
      }
      // 사용자의 요청(req.body.function)에 따라 Transaction에 담을 request 객체 생성
      // 요청에 따라 채널과 체인코드가 다르게 설정됨.
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
      // 연결된 peer에게 쿼리 요청 전달
      return channel.queryByChaincode(request);
    })
    .then(query_responses => {
      console.log("쿼리에 성공하셨습니다. 결과를 확인하세요");

      // 쿼리에 대한 응답.
      if (query_responses) {
        if (query_responses[0] instanceof Error) {
          console.error("쿼리에 에러가 발생했습니다. = ", query_responses[0]);
        } else {
          console.log("쿼리에 대한 응답: ", query_responses[0].toString());
          res.send({
            code: 200,
            success: "query completed sucessfully",
            result: query_responses[0].toString()
          });
        }
      } else {
        console.log("요청하신 데이터가 존재하지 않습니다.");
      }
    })
    .catch(err => {
      console.error("쿼리에 실패하였습니다. :: " + err);
    });
};

exports.org4 = function(req, res) {
  connection.query("SELECT * FROM dog WHERE id = ?", [req.body.dogId], function(
    error,
    results,
    fields
  ) {
    if (error) {
      console.error(error);
      res.send({
        code: 400,
        failed: "error ocurred"
      });
    } else {
      if (results.length > 0) {
        medicalver = String(results[0].medical);
        healthver = String(results[0].healthcare);
      }
    }
  });
  var store_path = path.join(__dirname, "../인증서_DogDoq");
  Fabric_Client.newDefaultKeyValueStore({ path: store_path })
    .then(state_store => {
      // fabric-client의 폴더 설정
      fabric_client.setStateStore(state_store);
      var crypto_suite = Fabric_Client.newCryptoSuite();

      // fabric-client SDK가 설정해놓은 폴더에 있는 인증서 정보를 fabric_client에서 활용
      var crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      // 유저에 대한 인증서 정보가 있다면 request에 sign을 함
      return fabric_client.getUserContext(req.body.email, true);
    })
    .then(user_from_store => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log(
          req.body.email+" 님의 정보가 인증되었습니다."
        );
        member_user = user_from_store;
      } else {
        throw new Error(
          "DogDoq의 회원이 아닙니다."
        );
      }
      // 사용자의 요청(req.body.function)에 따라 Transaction에 담을 request 객체 생성
      // 요청에 따라 채널과 체인코드가 다르게 설정됨.
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
      // 연결된 peer에게 쿼리 요청 전달
      return channel.queryByChaincode(request);
    })
    .then(query_responses => {
      console.log("쿼리에 성공하셨습니다. 결과를 확인하세요");

       // 쿼리에 대한 응답.
      if (query_responses) {
        if (query_responses[0] instanceof Error) {
          console.error("쿼리에 에러가 발생했습니다. = ", query_responses[0]);
        } else {
          console.log("쿼리에 대한 응답: ", query_responses[0].toString());
          res.send({
            code: 200,
            success: "query completed sucessfully",
            result: query_responses[0].toString()
          });
        }
      } else {
        console.log("요청하신 데이터가 존재하지 않습니다.");
      }
    })
    .catch(err => {
       console.error("쿼리에 실패하였습니다. :: " + err);
    });
};
