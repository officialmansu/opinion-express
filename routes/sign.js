var express = require('express');
var router = express.Router();
var firebase = require("firebase");

router.get('/in', function(req, res, next) {
  var currentUser = firebase.auth().currentUser;
  if(!currentUser) {
    res.render('in');
  } else {
    res.redirect('/article/edit');
  }
});

router.post('/out', function(req, res, next) {
  //firebase 영역
  res.send('out');
});

router.get('/up', function(req, res, next) {
  var currentUser = firebase.auth().currentUser;
  if(!currentUser) {
    res.render('up');
  } else {
    res.redirect('/article/edit');
  }
});

router.post('/remove', function(req, res, next) {
  //firebase 영역
  res.send("Sign Page");
});

router.post('/inChk', function(req, res, next) {
  //firebase 영역
  firebase.auth().signInWithEmailAndPassword(req.body.email, req,body.passwd)
    .then(function(user) {
      res.redirect('/article/edit');
      //res.send(user.email);
    }).catch(function(err) {
      //res.redirect('sign/in');
    });
});

router.post('/upChk', function(req, res, next) {
  //firebase 영역
  firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.passwd)
    .then(function(user) {
      res.redirect('/article/edit');
    }).catch(function(err) {
      res.redirect('up');
    });
});

module.exports = router;//라우터 기능 파일 export
//TypeError: Router.use() requires a middleware function but got a Object