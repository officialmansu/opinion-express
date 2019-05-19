var express = require('express');
var router = express.Router();
var firebase = require("firebase");
var server = require('http').Server(express);
var io = require('socket.io')(server);

var config = {
  apiKey: "AIzaSyBo5SePT0lxxtA40y8QBVvptNbUO1kGApY",
  authDomain: "opinion-express.firebaseapp.com",
  databaseURL: "https://opinion-express.firebaseio.com",
  projectId: "opinion-express",
  storageBucket: "opinion-express.appspot.com",
  messagingSenderId: "978199192904"
};
firebase.initializeApp(config);
var db = firebase.firestore();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

//로그인 페이지
//2019-05-04-라우터 구조 재구성
router.get('/login', function(req, res, next) {
  var user = firebase.auth().currentUser;
  if(!user) {
    res.render('login', { message: '' });//로그인 되어있지 않을 시 로그인 페이지로
  } else {
    res.redirect('articles');//로그인 시 글 index 페이지로
  }
});

//로그인 로직
//2019-05-04-라우터 구조 재구성
router.post('/loginChk', function(req, res, next) {
  firebase.auth().signInWithEmailAndPassword(req.body.email, req.body.passwd)
    .then(function(user) {
      res.redirect('articles');//글 작성 페이지 이동
    }).catch(function(error) {
      res.redirect('login');//로그인 페이지 이동
    });
});

//계정 추가 페이지
//2019-05-04-라우터 구조 재구성
router.get('/signup', function(req, res, next) {
  var user = firebase.auth().currentUser;
  if(!user) {
    res.render('signup', { message: '' });//로그인 false 시 가입 페이지 이동
  } else {
    res.redirect('/');//로그인 true 시 index 페이지 이동
  }
});

//계정 추가 로직
//2019-05-04-라우터 구조 재구성
router.post('/signupChk', function(req, res, next) {
  firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.passwd)
    .then(function() {
      res.redirect('login');//성공 시 로그인 페이지로
    }).catch(function(error) {
      res.redirect('signup');//실패 시 signup 페이지로
    });
});

//로그아웃 로직
//2019-05-04-라우터 구조 재구성
router.post('/logout', function(req, res, next) {
  var user = firebase.auth().currentUser;
  if(!user) {
    res.redirect('articles');
  } else {
    firebase.auth().signOut().then(function() {
      res.redirect('login');//로그아웃 후 로그인 페이지 이동
    });
  }
});

//글 목록 페이지

/*router.get('/articles/:author', function(req, res, next) {
  db.collection("articles").where("author", "==", author).get()
  res.render('articles');

  쿼리가 '/all'일 시, 전체 글 목록 표시.
  쿼리가 '/:author'일 시, 특정 author 글 목록 표시.

  //console.log(user);
  var articles = db.collection("articles").where('').orderBy().get()//Firebase 에서 해당 유저가 작성한 글 가져오기
    .then()2019-04-29
});*/
server.listen(3003);
//글 작성 페이지
//2019-05-04-라우터 구조 재구성
router.get('/editArticle', function(req, res, next) {
  var user = firebase.auth().currentUser;
  if(!user) {
    res.redirect('login');//계정 정보 없을 시, 로그인 페이지로.
  } else {
    //db.collection("articles").doc();
    res.render('editArticle', { usrmail: user.email });//계정 상태 유효할 시, 글 작성 페이지로.
    io.on('connection', function(socket) {
      socket.on('editedContents', function(data) {
        console.log(data);
      });
    });
  }
});

router.get('/articles', function(req, res, next) {
  var user = firebase.auth().currentUser;
  res.render('articles', { currentUser: user });
});

module.exports = router;