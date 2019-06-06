var express = require('express');
var session = require('express-session');
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
router.get('/', (req, res, next) => {
	res.render('index', {
		currentUser: req.session.isLogin
	});
});

//로그인 페이지
//2019-05-04-라우터 구조 재구성
router.get('/login', (req, res, next) => {
	if (req.session.isLogin) {
		res.redirect('articles/all');
		//로그인 되어있지 않을 시 로그인 페이지로
	} else {
		//로그인 시 글 index 페이지로
		res.render('login', {
			message: ''
		}); 
	}
});

//로그인 로직
//2019-05-04-라우터 구조 재구성
router.post('/loginChk', (req, res, next) => {
	firebase.auth().signInWithEmailAndPassword(req.body.email, req.body.passwd).then((user) => {
		req.session.isLogin = true;
		req.session.usrmail = req.body.email;
		res.redirect('articles/all'); //글 작성 페이지 이동
	}).catch((err) => {
		res.redirect('login'); //로그인 페이지 이동
	});
});

//계정 추가 페이지
//2019-05-04-라우터 구조 재구성
router.get('/signup', (req, res, next) => {
	if (req.session.isLogin) {
		res.redirect('/'); //로그인 true 시 index 페이지 이동
	} else {
		res.render('signup', {
			message: ''
		}); //로그인 false 시 가입 페이지 이동
	}
});

//계정 추가 로직
//2019-05-04-라우터 구조 재구성
router.post('/signupChk', (req, res, next) => {
    firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.passwd).then(() => {
        res.redirect('login'); //성공 시 로그인 페이지로
    }).catch((err) => {
        res.redirect('signup'); //실패 시 signup 페이지로
    });
});

//로그아웃 로직
//2019-05-04-라우터 구조 재구성
router.post('/logout', (req, res, next) => {
	firebase.auth().signOut().then(() => {
		req.session.destroy();
		res.redirect('/'); //로그아웃 후 로그인 페이지 이동
	});
});

//글 작성 페이지
//2019-05-04-라우터 구조 재구성
server.listen(3003);
router.get('/editArticle', (req, res, next) => {
	if(req.session.isLogin) {
		var doc = db.collection("articles").doc();
		var postData = {
			author: req.session.usrmail,
			currentTime: new Date(),
			id: doc.id
		};
		doc.set(postData); //1 doc is created.
		res.render('editArticle', {
			usrmail: req.session.usrmail,
			articleId: doc.id
		}); //계정 상태 유효할 시, 글 작성 페이지로
		io.on('connection', (socket) => {
			socket.on('editedContents', (data) => {
				console.log("----- socket내부 -----");
				console.log(data);
				postData.id = data.articleId;
				postData.title = data.title;
				postData.subtitle = data.subtitle;
				postData.article = data.article;
				postData.currentTime = new Date();
				db.collection("articles").doc(data.articleId).set(postData); //updating doc (it was created at 112)
			});
		});
	} else {
		res.redirect('login'); //계정 정보 없을 시, 로그인 페이지로.
	}
});

router.get('/updateArticle/:id', (req, res, next) => {
	if(req.session.isLogin) {
		db.collection('articles').doc(req.params.id).get().then((response) => {
			var postData = {
				title: response.data().title,
				subtitle: response.data().subtitle,
				article: response.data().article,
				author: response.data().author
			};
			res.render('updateArticle', {
				article: response.data()
			});
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
	} else {
		res.redirect('login');
	}
});

router.get('/viewArticle/:id', (req, res, next) => {
    var doc = db.collection("articles").doc(req.params.id);
    doc.get().then((doc) => {
		if (!doc.exists) {
			console.log("Doc is NOT exist.");
		} else {
			res.render('viewArticle', {
				articleBody: doc.data()
			});
		}
	}).catch((err) => {
		console.log(err);
	});
});

router.get('/articles/:author', (req, res, next) => {
    //var user = firebase.auth().currentUser;
    if (req.params.author == 'all') {
        db.collection('articles').orderBy("currentTime").get().then((response) => {
			var articles = [];
			response.forEach((doc) => {
				var articleData = doc.data();
				articles.push(articleData);
			});
			res.render('articles', {
				currentUser: req.session.usrmail,
				articles: articles
			});//확인 필요
		}).catch((err) => {
			console.log("-----at '/articles/all'-----");
			console.log(err);
			console.log("-----at '/articles/all'-----");
		});
    } else if (req.params.author) {
        db.collection('articles').orderBy("currentTime").where("author", "==", req.params.author).get().then((response) => {
			var articles = [];
			response.forEach((doc) => {
				var articleData = doc.data();
				articles.push(articleData);
			});
			res.render('articles', {
				currentUser: req.session.usrmail,
				articles: articles
			});
		}).catch((err) => {
			console.log("-----at '/articles/:author'-----");
			console.log(err);
			console.log("-----at '/articles/:author'-----");
		});
    }
});

router.post('/delete', function (req, res, next) {
    console.log("-----at '/delete'-----");
    console.log(req.body.id);
    console.log("-----at '/delete'-----");
    db.collection('articles').doc(req.body.id).delete().then(() => {
		res.redirect('articles/all');
	}).catch((err) => {
		console.log("-----at '/delete'-----");
		console.log(err);
		console.log("-----at '/delete'-----");
	});
});

module.exports = router;