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
  