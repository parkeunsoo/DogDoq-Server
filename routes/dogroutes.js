// 농장에서 초기 강아지 등록.
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
  
  // 펫샵에서 피분양자 ID와 강아지 ID 연결.
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
  