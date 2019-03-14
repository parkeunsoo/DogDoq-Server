"use strict";

//Fabric, Fabric_CA SDK와 파일 경로 설정을 위해 필요한 node module
var Fabric_Client = require("fabric-client");
var Fabric_CA_Client = require("fabric-ca-client");
var path = require("path");

var fabric_client = new Fabric_Client();
var fabric_ca_client = null;
var admin_user = null;
var store_path = path.join(__dirname, "인증서_병원");

console.log("인증서 폴더:" + store_path);

Fabric_Client.newDefaultKeyValueStore({ path: store_path })
  .then(state_store => {
    // fabric_client의 폴더 설정
    fabric_client.setStateStore(state_store);
    var crypto_suite = Fabric_Client.newCryptoSuite();

    // fabric_client SDK가 설정해놓은 폴더에 있는 인증서 정보를 fabric_client에서 활용
    var crypto_store = Fabric_Client.newCryptoKeyStore({ path: store_path });
    crypto_suite.setCryptoKeyStore(crypto_store);
    fabric_client.setCryptoSuite(crypto_suite);
    var tlsOptions = {
      trustedRoots: [],
      verify: false,
      rejectUnauthorized: false
    };
    // 병원 CA와 연결.
    fabric_ca_client = new Fabric_CA_Client(
      "https://0.0.0.0:9054",
      tlsOptions,
      "ca-org3",
      crypto_suite
    );
    // 관리자가 등록되어 있는지 확인.
    return fabric_client.getUserContext("admin", true);
  })
  .then(user_from_store => {
    if (user_from_store && user_from_store.isEnrolled()) {
      console.log("CA 서버 관리자를 성공적으로 로드했습니다.");
      admin_user = user_from_store;
      return null;
    } else {
      // CA 서버에 관리자를 등록.
      return fabric_ca_client
        .enroll({
          enrollmentID: "admin",
          enrollmentSecret: "adminpw"
        })
        .then(enrollment => {
          console.log("관리자가 admin 이라는 ID로 등록되었습니다.");

          // 비밀정보를 이용하여 관리자의 저장소에 인증서 생성
          // 병원의 관리자이므로 Org3의 MSP 부여
          return fabric_client.createUser({
            username: "admin",
            mspid: "Org3MSP",
            cryptoContent: {
              privateKeyPEM: enrollment.key.toBytes(),
              signedCertPEM: enrollment.certificate
            }
          });
        })
        .then(user => {
          admin_user = user;
          return fabric_client.setUserContext(admin_user);
        })
        .catch(err => {
          console.error(
            "관리자 등록에 실패했습니다. " + err.stack
              ? err.stack
              : err
          );
          throw new Error("관리자 등록에 실패했습니다. ");
        });
    }
  })
  .then(() => {
    console.log(
      "관리자가 병원의 CA 서버를 관리하게 되었습니다. ::"
    );
  })
  .catch(err => {
    console.error("관리자 등록에 실패했습니다.: " + err);
  });
