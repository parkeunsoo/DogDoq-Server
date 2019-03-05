const express = require("express");
const login = require("./routes/loginroutes");
const invoke = require("./routes/invokeroutes");
const query = require("./routes/queryroutes");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var router = express.Router();

router.post("/register", login.register); //회원가입
router.post("/login", login.login); //로그인
router.post("/dog", login.dogregister); //강아지등록
router.post("/owner", login.ownerregister); //주인등록
router.post("/mydog", login.mydog); //내 강아지 불러오기
router.post("/alldog", login.alldog); //등록된 강아지 모두 불러오기
router.post("/user1/invoke", invoke.org1); //기관 1 데이터 생성
router.post("/user2/invoke", invoke.org2); //기관 2 데이터 생성
router.post("/user3/invoke", invoke.org3); //기관 3 데이터 생성
router.post("/user1/query", query.org1); //기관 1 데이터 조회
router.post("/user2/query", query.org2); //기관 2 데이터 조회
router.post("/user3/query", query.org3); //기관 3 데이터 조회
router.post("/user4/query", query.org4); //기관 4 데이터 조회
app.use("/api", router);

app.listen(3001, () => {
  console.log("DogDoq server listening on port 3001!");
});
