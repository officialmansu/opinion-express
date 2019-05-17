var express = require('express');
var router = express.Router();
var firebase = require("firebase");

router.get('/', function(req, res, next) {
    res.send("article");
});

router.get('/edit', function(req, res, next) {
    var currentUser = firebase.auth().currentUser;
    if(!currentUser) {
        res.redirect('sign/in');
    } else {
        res.render('edit');
    }
    //firebase 영역
    
});

module.exports = router;