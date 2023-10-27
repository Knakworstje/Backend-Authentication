const express = require('express');

const app = express();

const bcrypt = require('bcrypt');

var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root", //dangerous, change to something else
  password: "my password",
  database: "db1"
});

function generateUniqueSalt(callback) {
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    const checkSalt = () => {
      salt = bcrypt.genSaltSync(15);
      con.query(`SELECT * FROM Login WHERE salt = '${salt}'`, function (err, result) {
        if (err) {
          callback(err);
        } else if (result.length > 0) {
          // If the salt already exists, try generating a new one
          checkSalt();
        } else {
          // If the salt is unique, call the callback with the unique salt
          callback(null, salt);
        }
      });
    };
  });
}

app.get('/login/:loginUsername/:loginPassword', (req, res) => {
  if (req.params.loginUsername && req.params.loginUsername.length > 0 && req.params.loginPassword && req.params.loginPassword.length > 0) {    
    let salt;
    //SSN salt getting
    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        con.query(`SELECT salt FROM Login WHERE username = '${req.params.loginUsername}';`, function (err, result) {
          if (err) {
            res.sendStatus(500);
            console.error(err);
            return;
          }
          if (result.length > 0) {
            salt = result[0].salt;
          } else {
            res.send("No account found, contact your administrator if you believe that this is an error.");
            return;
          }

          const loginUsername = req.params.loginUsername;
          const loginPasswordHashed = bcrypt.hashSync(req.params.loginPassword, salt);

          con.query(`SELECT hash FROM Login WHERE username = '${loginUsername}'`, function (err, result) {
            if (err) {
              res.sendStatus(500);
              console.error(err);
              return;
            }
            if (result.length > 0) {
              if (result[0].hash === loginPasswordHashed) {
                res.send("Data");
              } else {
                res.sendStatus(401);
              }
            } else {
              res.sendStatus(401);
            }
          });
        });
    });

  } else {
    res.sendStatus(401);
  }
});

app.get('/register/:registerUsername/:registerPassword/:registerEmailaddress', (req, res) => {
    if (req.params.registerUsername && req.params.registerUsername.length > 0 && req.params.registerPassword && req.params.registerPassword.length > 0) {
      
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        con.query(`SELECT * FROM Login WHERE username = '${req.params.registerUsername}'`, function (err, result) {
          if (err) {
            res.sendStatus(500);
            console.error(err);
            return;
          }
          if (result.length > 0) {
            res.send("Username already exists!");
            return;
          }

            con.query(`SELECT * FROM Login WHERE emailaddress = '${req.params.registerEmailaddress}'`, function (err, result) {
              if (err) {
                res.sendStatus(500);
                console.error(err);
                return;
              }
              if (result.length > 0) {
                res.send("Please use an unique emailaddress!");
                return;
              }

              let salt;

              generateUniqueSalt(function(err, uniqueSalt) {
                if (err) {
                  res.sendStatus(500);
                  console.error(err);
                  // Handle the error here
                } else {
                  salt = uniqueSalt;
                  // Use the uniqueSalt for further processing
                }
              });
        
              const registerPasswordHashed = bcrypt.hashSync(req.params.registerPassword, salt);
        
                con.query(`INSERT INTO Login (hash, salt, username, emailaddress) VALUES ('${registerPasswordHashed}', '${salt}', '${req.params.registerUsername}', '${req.params.registerEmailaddress}'`, function (err, result) {
                  if (err) {
                    res.sendStatus(500);
                    console.error(err);
                    return;
                  }
                });
              console.log("New account created.");
              res.sendStatus(200);
            });
        });
      });
    
    } else {
      res.sendStatus(401);
    }
});

app.listen(3000, () => {
    console.log(`Listening on port 3000`);
})