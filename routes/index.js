var express = require('express');
var router = express.Router();
var firebase = require("firebase");
var server = require('http').Server(express);
var io = require('socket.io')(server);
var dateFormat = require('dateformat');

var firebaseConfig = {
  apiKey: "AIzaSyBo5SePT0lxxtA40y8QBVvptNbUO1kGApY",
  authDomain: "opinion-express.firebaseapp.com",
  databaseURL: "https://opinion-express.firebaseio.com",
  projectId: "opinion-express",
  storageBucket: "opinion-express.appspot.com",
  messagingSenderId: "978199192904",
  appId: "1:978199192904:web:aa91748de9114389"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

/* GET home page. */
router.get('/', function(req, res, next) {
  var user = firebase.auth().currentUser;
  res.render('index', { currentUser: user });
});

//로그인 페이지
//2019-05-04-라우터 구조 재구성
router.get('/login', function(req, res, next) {
  var user = firebase.auth().currentUser;
  if(!user) {
    res.render('login', { message: '' });//로그인 되어있지 않을 시 로그인 페이지로
  } else {
    res.redirect('articles/all');//로그인 시 글 index 페이지로
  }
});

//로그인 로직
//2019-05-04-라우터 구조 재구성
router.post('/loginChk', function(req, res, next) {
  firebase.auth().signInWithEmailAndPassword(req.body.email, req.body.passwd)
    .then(function(user) {
      res.redirect('articles/all');//글 작성 페이지 이동
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
    res.redirect('articles/all');
  } else {
    firebase.auth().signOut().then(function() {
      res.redirect('/');//로그아웃 후 로그인 페이지 이동
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

//글 작성 페이지
//2019-05-04-라우터 구조 재구성
server.listen(3003);
router.get('/editArticle', (req, res, next) => {
  
  var user = firebase.auth().currentUser;
  if(!user) {
    res.redirect('login');//계정 정보 없을 시, 로그인 페이지로.
  } else {
    var doc = db.collection("articles").doc();
    var postData = {
      author: user.email,
      currentTime: new Date(),
      id: doc.id
    }
    doc.set(postData); //1 doc is created.
    res.render('editArticle', { usrmail: user.email, articleId: doc.id });//계정 상태 유효할 시, 글 작성 페이지로
    /*console.log("----- socket전 -----");
    console.log(docId);
    console.log("----- socket전 -----");*/
    io.on('connection', (socket) => {
      socket.on('editedContents', (data) => {
        console.log("----- socket내부 -----");
        //console.log(docId);
        console.log(data);
        postData.id = data.articleId;
        postData.title = data.title;
        postData.subtitle = data.subtitle;
        postData.article = data.article;
        postData.currentTime = new Date();
        db.collection("articles").doc(data.articleId).set(postData);//updating doc (it was created at 112)
        /*console.log("-----DEBUG(articleNum)-----");//Debugging for postData.articleId
        console.log(postData.articleId);//Why the postData.articleId was piled up like snowball?
        console.log("-----DEBUG(articleNum)-----");
        console.log("----- socket내부 -----");*/
      });
    });
  }
});

//server.listen(3004);
router.get('/updateArticle/:id', function(req, res, next) {
  
  var user = firebase.auth().currentUser;
  if(!user) {
    res.redirect('login');
  } else {
    db.collection('articles').doc(req.params.id).get()
      .then((response) => {
        var postData = {
          title: response.data().title,
          subtitle: response.data().subtitle,
          article: response.data().article,
          author: response.data().author
        }
        //console.log(response.data());
        res.render('updateArticle', { article: response.data() });
        io.on('connection', (socket) => {
          socket.on('editedContents', (data) => {
            postData.title = data.title;
            postData.subtitle = data.subtitle;
            postData.article = data.article;
            postData.currentTime = new Date();
            postData.id = data.articleId;
            db.collection('articles').doc(data.articleId).set(postData);
          });
        });
      }).catch((err) => {
        console.log(err);
      });
  }
});

router.get('/viewArticle/:id', function(req, res, next) {
  var doc = db.collection("articles").doc(req.params.id);
  var getDoc = doc.get()
    .then(doc => {
      if(!doc.exists) {
        console.log("Doc is NOT exist.");
      } else {
        res.render('viewArticle', { articleBody: doc.data() });
      }
    }).catch(err => {
      console.log(err);
    });
});

router.get('/articles/:author', function(req, res, next) {
  var user = firebase.auth().currentUser;
  if(req.params.author == 'all') {
    db.collection('articles').orderBy("currentTime").get()
    .then((response) => {
      var articles = [];
      response.forEach((doc) => {
        var articleData = doc.data();
        articles.push(articleData);
      });
      if(!user) {
        res.render('articles', { currentUser: user, articles: articles });//currentUser 삭제 후 반응 보기
      } else {
        res.render('articles', { currentUser: user.email, articles: articles });
      }
    }).catch((err) => {
      console.log(err);
    });
  } else if(req.params.author) {
    db.collection('articles').orderBy("currentTime").where("author", "==", req.params.author).get()
      .then((response) => {
        var articles = [];
        response.forEach((doc) => {
          var articleData = doc.data();
          articles.push(articleData);
        });
        if(!user) {
          res.render('articles', { currentUser: user, articles: articles });//currentUser 삭제 후 반응 보기
        } else {
          res.render('articles', { currentUser: user.email, articles: articles });
        }
      }).catch((err) => {
        console.log("-----at '/articles/:author'-----");
        console.log(err);
        console.log("-----at '/articles/:author'-----");
      })
  }
  //console.log(articles);
});

router.post('/delete', function(req, res, next) {
  console.log("-----at '/delete'-----");
  console.log(req.body.id);
  console.log("-----at '/delete'-----");
  db.collection('articles').doc(req.body.id).delete()
    .then(() => {
      res.redirect('articles/all');
    }).catch((err) => {
      console.log("-----at '/delete'-----");
      console.log(err);
      console.log("-----at '/delete'-----");
    });
});

module.exports = router;