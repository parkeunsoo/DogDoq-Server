//Fabric SDK와 파일 경로 설정을 위해 필요한 node module
var Fabric_Client = require("fabric-client");
var path = require("path");
var util = require("util");
var fs = require("fs");
var fabric_client = new Fabric_Client();

// transaction id를 할당할 변수 생성
var tx_id = null;

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

// 오더러 생성과 노드간 TLS통신을 위한 오더러의 TLS인증서 경로설정
var caordererPath =
  "../DogDoq-Network/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem";
let dataorder = fs.readFileSync(caordererPath);
let caorderer = Buffer.from(dataorder).toString();
var order = fabric_client.newOrderer("grpcs://localhost:7050", {
  pem: caorderer,
  "ssl-target-name-override": "orderer.example.com:7050"
});

// 채널 4개 생성
var channel;
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
channel4.addPeer(peer1);
channel1.addOrderer(order);
channel2.addOrderer(order);
channel3.addOrderer(order);
channel4.addOrderer(order);

exports.create = function(req, res) {
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
        // 현재는 MobileApplication에서 인코딩,해시작업을 진행하지만 추후에 서버로 옮길 예정
        // var encodingValue = req.body.encodingvalue;
        // var hashValue = req.body.hashvalue;
  
        // fabric-client에 저장된 회원의 인증서 정보에 따라 트랜잭션ID를 생성.
        tx_id = fabric_client.newTransactionID();
        console.log("Assigning transaction_id: ", tx_id._transaction_id);
  
        // 사용자의 요청(req.body.function)에 따라 Transaction에 담을 request 객체 생성
        // 요청에 따라 채널과 체인코드가 다르게 설정됨.
        if (req.body.function == "createPurchase") {
          var request = {
            chaincodeId: "channel1",
            fcn: "createPurchase",
            args: [req.body.dogId, req.body.hashValue, req.body.encodingValue],
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
        // 연결된 peer에게 transaction 생성 요청 전달 
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
          console.log("정상적인 트랜잭션입니다.");
          res.send({
            code: 200,
            success: "invoke sucessfully"
          });
        } else {
          console.error(proposalResponses + "트랜잭션이 올바르지 않습니다.");
        }
        if (isProposalGood) {
          console.log(
            util.format(
              '요청이 성공적으로 전달되었고 그에 대한 응답이 성공적으로 도착했습니다. : Status - %s, message - "%s"',
              proposalResponses[0].response.status,
              proposalResponses[0].response.message
            )
          );
  
          // 트랜잭션을 블록에 담기위해 오더러에게 보낼 트랜잭션 request 생성
          // 피어의 체인코드에서 시뮬레이션 결과 이상이 없다는 것을 확인한 응답을 통해 request를 생성함
          var request = {
            proposalResponses: proposalResponses, 
            proposal: proposal
          };
          // event processing에 사용될 트랜잭션 ID를 변수에 저장
          var transaction_id_string = tx_id.getTransactionID(); 
          var promises = [];
  
          // 채널에 request를 담은 트랜잭션 전송.-> channel.sendTransaction(request)
          // promise 구문을 사용하기위해 보낸 트랜 잭션 정보를 push
          var sendPromise = channel.sendTransaction(request);
          promises.push(sendPromise); 
  
          // peer1의 정보를 통해 event_hub에 접근
          let event_hub = channel.newChannelEventHub(peer1);
  
          // transaction이 30초안에 처리 되지 않으면 연결이 끊킴
          // 오더러에 전송한 트랜잭션의 커밋 결과를 알람을 받기 위해 event_hub에 트랜잭션 ID 등록 (트랜잭션이 블록에 커밋되면 알림 수신)
          let txPromise = new Promise((resolve, reject) => {
            let handle = setTimeout(() => {
              event_hub.unregisterTxEvent(transaction_id_string);
              event_hub.disconnect();
              resolve({ event_status: "TIMEOUT" }); 
            }, 3000);
            event_hub.registerTxEvent(
              transaction_id_string,
              (tx, code) => {
                // 전송한 트랜잭션 상태에 대한 응답
                clearTimeout(handle);
                var return_status = {
                  event_status: code,
                  tx_id: transaction_id_string
                };
                if (code !== "VALID") {
                  console.error("트랜잭션이 올바르지 않습니다., code = " + code);
                  resolve(return_status);
                } else {
                  console.log(
                    "트랜잭션이 peer에 commit 되었습니다." +
                      event_hub.getPeerAddr()
                  );
                  resolve(return_status);
                }
              },
              err => {
                reject(
                  new Error("event_hub에 트랜잭션 등록을 실패했습니다. ::" + err)
                );
              },
              { disconnect: true } 
            );
            event_hub.connect();
          });
          promises.push(txPromise);
  
          return Promise.all(promises);
        } else {
          console.error(
            "올바른 트랜잭션 생성 요청이 아닙니다."
          );
          throw new Error(
            "올바른 트랜잭션 생성 요청이 아닙니다."
          );
        }
      })
      .then(results => {
        console.log(
          "트랜잭션이 성공적으로 채널에 전송되었으며 event_hub에 등록되었습니다."
        );
          // Promise 문 결과 확인
        if (results && results[0] && results[0].status === "SUCCESS") {
          console.log("트랜잭션이 성공적으로 오더러에게 전송되었습니다.");
        } else {
          console.error(
            "트랜잭션이 오더러에게 전송되지 못했습니다, " + results[0].status
          );
        }
  
        if (results && results[1] && results[1].event_status === "VALID") {
          console.log(
            "트랜잭션이 성공적으로 블록에 commit 되었습니다."
          );
        } else {
          console.log(
            "트랜잭션이 블록에 commit 되지 못했습니다.::" +
              results[1].event_status
          );
        }
      })
      .catch(err => {
        console.error("invoke에 실패했습니다. :: " + err);
        res.send({
          code: 400,
          failed: "error ocurred"
        });
      });
  };