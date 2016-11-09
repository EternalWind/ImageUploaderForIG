var express = require('express');
var router = express.Router();
var img_helpers = require("../helpers/image-helpers.js");
var path = require("path");
var instagram = require("instagram-private-api").V1;

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Express' });
});

router.post("/upload", function (req, res) {
    var img_count = req.body.imgs.length;

    for (var i = 0; i < img_count; ++i) {
        img_helpers.saveImgDataUrl("img" + i, req.body.imgs[i]);
    }

    var session = {};
    var processChain = login(req.body.user, req.body.pwd)
        .then(function (s) {
            session = s;
        });
    var idx = 0;

    for (var j = 0; j < img_count; ++j) {
        processChain = processChain
            .then(function () {
                return instagram.Upload.photo(session, "./img" + idx + ".jpeg");
            })
            .then(function (upload) {
                console.log("Upload Id: " + upload.params.uploadId);
                return instagram.Media.configurePhoto(session, upload.params.uploadId, "no." + idx);
            })
            .then(function (medium) {
                console.log("Medium params: " + medium.params);
                idx++;
            });
    }

    result = {
        msg: "ok!"
    };

    res.send(result);
});

function login(user, pwd) {
    var device = new instagram.Device(user);
    var storage = new instagram.CookieFileStorage("./cookies/" + user + ".json");

    return instagram.Session.create(device, storage, user, pwd);
}

router.post("/login", function (req, res) {
    login(req.body.user, req.body.pwd)
        .then(function (session) {
            res.send(
                {
                    status: "ok"
                });
        });
});

router.post("/test", function (req, res) {
    login(req.body.user, req.body.pwd)
        .catch(function (e) {
            console.log("Error! " + e);
        })
        .then(function (session) {
            return [session, instagram.Account.searchForUser(session, "instagram")];
        })
        .spread(function (session, account) {
            console.log("The account id for instagram is " + account.id);

            result = {
                msg: "The account id for instagram is " + account.id
            };

            res.send(result);
            });
});

module.exports = router;