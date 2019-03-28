const express = require("express");
const login = require("./routes/loginroutes");
const invoke = require("./routes/invokeroutes");
const query = require("./routes/queryroutes");
const dog = require("./routes/dogroutes");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var router = express.Router();

router.post("/register", login.register); //사용자 회원가입
router.post("/login", login.login); //사용자 로그인
router.post("/dog", dog.dogregister); //강아지등록
router.post("/owner", dog.ownerregister); //주인등록
router.post("/mydog", dog.mydog); //내 강아지 불러오기
router.post("/alldog", dog.alldog); //등록된 강아지 모두 불러오기
router.post("/user1/invoke", invoke.org1); //기관 1 데이터 생성
router.post("/user2/invoke", invoke.org2); //기관 2 데이터 생성
router.post("/user3/invoke", invoke.org3); //기관 3 데이터 생성
router.post("/user1/query", query.org1); //기관 1 데이터 조회
router.post("/user2/query", query.org2); //기관 2 데이터 조회
router.post("/user3/query", query.org3); //기관 3 데이터 조회
router.post("/user4/query", query.org4); //기관 4 데이터 조회
app.use("/api", router);

app.listen(3001, () => {
  console.log("DogDoq-Server 가동중...");
});

// 변경 예정
// router.get("auth/me")
// router.get("auth/refresh")
// router.post("auth/register")
// router.post("auth/login")
// router.post("dog/:id")//강아지 등록
// router.get("dog/:id")//강아지의 상태 값 출력 (ID,문서버전,주인 ID)
// rotuer.get("dog/:id/:document")
// rotuer.post("dog/:id/:document")
// router.get("user/dog/:id")// 자신의 강아지 출력
