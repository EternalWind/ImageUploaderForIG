﻿var express = require('express');
var router = express.Router();
var img_helpers = require("../helpers/image-helpers.js");
var path = require("path");
var instagram = require("instagram-private-api").V1;

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Image Uploader For IG' });
});

router.post("/upload", function (req, res) {
    var img_count = req.body.imgs.length;
    var processChain = {};
    processChain.then = function (func) {
        return func();
    };

    for (var i = 0; i < img_count; ++i) {
        processChain = processChain.then(function () {
            return img_helpers.saveImgDataUrl("img" + i, req.body.imgs[i])
        });
    }

    var session = {};
    processChain = processChain.then(function () {
        return login(req.body.user, req.body.pwd);
    }).then(function (s) {
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
                var caption = req.body.captions[idx].replace(/<br>/g, "\n");

                return instagram.Media.configurePhoto(session, upload.params.uploadId, caption);
            })
            .then(function (medium) {
                console.log("Medium params: " + medium.params);
                idx++;
            })
            .catch(function (err) {
                ajaxError(res, 500, err);
            });
    }

    processChain.then(function () {
        result = {
            msg: "ok!"
        };

        res.send(result);
    });
});

function login(user, pwd) {
    var device = new instagram.Device(user);
    var storage = new instagram.CookieFileStorage("./cookies/" + user + ".json");

    return instagram.Session.create(device, storage, user, pwd);
}

function ajaxError(res, statusCode, error) {
    res.status(statusCode);
    res.send(error);
    throw error;
}

router.post("/login", function (req, res) {
    login(req.body.user, req.body.pwd)
        .catch(function (err) {
            ajaxError(res, 500, err);
        })
        .then(function (session) {
            res.send(
                {
                    status: "ok"
                });
        });
});

router.post("/logout", function (req, res) {
    login(req.body.user, req.body.pwd)
    .then(function (session) {
        return session.destroy();
    })
    .catch(function (err) {
        ajaxError(res, 500, err);
    })
    .then(function () {
        res.send(
        {
            status: "ok"
        });
    });
})

module.exports = router;