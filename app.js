
/**
 * Module dependencies.
 */
var C = require('./config').config();
var express = require('express')
//  , routes = require('./routes')
  , md5 = require('MD5')
  , url = require('url');

var routes = {
  'index' : require('./routes').index,
  'newuser'  : require('./routes/user').newuser
}; 
console.log(routes);
var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

// get someone's memories
app.get('/download' , function(req , res) {
  var params = url.parse(req.url , true);
  var user_id = params.query.key;
  console.log(user_id + ' is downloading memroies');
  var db = require('mongojs').connect(C.db.url , C.db.collections);
  var _res = {
    'code' : 0,
    'msg' : '',
    'data' : undefined
  };
  if( ! user_id ){return false;}
  db.memories.find({'user_id' : user_id } , function(err , result) {
      if(err) {
          console.log(err);
          _res.code = 1;
          _res.msg = error;
          res.send(JSON.stringify(_res));
      } else {
          // already authoried and saved .
          if(result && result.length > 0 ) {
            _res.data = result[0].memories;
            res.send(JSON.stringify(_res));
          } else {
            _res.code = 1,
            _res.msg = 'wrong user';
            res.send(JSON.stringify(_res));
          }
      }
  });

});

// save user's memories 
app.get('/store', function(req , res){
  var params = url.parse(req.url , true);
  var db = require('mongojs').connect(C.db.url , C.db.collections);
  var user_id = 'xyn0563@gmail.com';
  var _res = {
    'code' : 0,
    'msg' : ''
  };

  db.memories.find({'user_id' : user_id } , function(err , result) {
      if(err) {
          console.log(err);
          _res.code = 1;
          _res.msg = error;
          res.send(JSON.stringify(_res));
      } else {
          // already authoried and saved .
          if(result && result.length > 0 ) {
              console.log(user_id + ' is existed , update');
              db.memories.update({'user_id' : user_id} , 
                  {$set : {'memories' : params.query.data}},
                  function(err , updated) {
                      if(err || !updated) {
                          console.log(err);
                          _res.code = 1;
                          _res.msg = error;
                      } else {
                      }
                      res.send(JSON.stringify(_res));
                  }
              );
          } else {
              db.memories.save({'user_id' : user_id , 'memories' : params.query.data} , function(err , saved) {
                  if( err || !saved) {
                      console.log('user not saved');
                      console.log(err);
                       _res.code = 1;
                       _res.msg = error;
                  } else {
                  }
                  res.send(JSON.stringify(_res));
              });
          }
      }
  });
});


app.get('/newuser' , routes.newuser);

//注册
app.get('/register' , function(req , res) {
  var params = url.parse(req.url , true);
  var db = require('mongojs').connect(C.db.url , C.db.collections);
  var email = params.query.email;
  var password = params.query.password;
  var pwd = md5(password);
  var _res = {'code':0 , 'msg' : ''};
  db.users.find({'email' : email} , function(err , result) {
      if(err) {
          console.log(err);
          _res.code = 1;
          _res.msg = error;
          res.send(JSON.stringify(_res));
      } else {
          // already authoried and saved .
          if(result && result.length > 0 ) {
              console.log(email + ' is taken');
              _res.code = 1;
              _res.msg = email + ' is taken , plz use another email';
              res.send(JSON.stringify(_res));
          } else {
              var _time = (new Date()).getTime();
              var token = md5(email + password + _time );
              db.users.save({'email' : email , 'password' : pwd , 'token' : token} , function(err , saved) {
                  if( err || !saved) {
                      console.log('user not saved');
                      console.log(err);
                       _res.code = 1;
                       _res.msg = error;
                  } else {
                  }
                  res.send(JSON.stringify(_res));
              });
          }
      }
  });
});

//登录
app.get('/login' , function(req , res) {
  var params = url.parse(req.url , true);
  var db = require('mongojs').connect(C.db.url , C.db.collections);
  var email = params.query.email;
  var password = params.query.password;
  var pwd = md5(password);
  var _res = {'code':0 , 'msg' : ''};
  db.users.find({'email' : email , 'password' : pwd } , function(err , result) {
      if(err) {
          console.log(err);
          _res.code = 1;
          _res.msg = error;
          res.send(JSON.stringify(_res));
      } else {
          if(result && result.length > 0 ) {
              console.log(email + ' is login');
              _res.data = {'token' : result[0].token};
              res.send(JSON.stringify(_res));
          } else {
              _res.code = 1;
              _res.msg = error;
              res.send(JSON.stringify(_res));
          }
      }
  });
});

app.listen(8081);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
