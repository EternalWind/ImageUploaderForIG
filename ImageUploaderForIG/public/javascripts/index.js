"use strict";

function onSelectedFiles(files) {
    var previewSection = document.getElementById("previewSection");

    previewSection.innerHTML = "";
    var reader = new FileReader();
    var fileCount = files.length;
    var currentFileIndex = 0;

    if (currentFileIndex < fileCount) {
        var callback = function (e) {
            previewSection.innerHTML += "<div class='img'><span class='img_vertical_alignment_helper'></span><img src='"
                + reader.result + "' onclick='onClickImage(this.src)' /></div>";
            currentFileIndex++;

            if (currentFileIndex < fileCount) {
                reader.readAsDataURL(files[currentFileIndex]);
            }
        };

        reader.onload = callback;
        reader.readAsDataURL(files[currentFileIndex]);
    }
}

function onClickImage(src) {
    window.open(src);
}

function onUpload() {
    var previewSection = document.getElementById("previewSection");
    var resizedPreviewSection = document.getElementById("resizedPreviewSection");

    if (previewSection && resizedPreviewSection) {
        resizedPreviewSection.innerHTML = "";

        var origImgs = previewSection.getElementsByTagName("img");
        var imgCount = origImgs.length;
        var currentImgIndex = 0;

        var resizedImgs = [];

        for (var i = 0; i < imgCount; ++i) {
            var aspect_ratio = origImgs[i].width / origImgs[i].height;
            var resizingWidth = aspect_ratio >= 1.0 ? 1024 : 1024 * aspect_ratio;
            var resizingHeight = aspect_ratio >= 1.0 ? 1024 / aspect_ratio : 1024;

            var canvas = document.createElement("canvas");
            canvas.width = resizingWidth;
            canvas.height = resizingHeight;

            resizedImgs.push(canvas);
        }

        // Resize the images!
        if (currentImgIndex < imgCount) {
            var callback = function (err) {
                if (err) {
                    alert(err);
                }

                currentImgIndex++;
                if (currentImgIndex < imgCount) {
                    pica.resizeCanvas(origImgs[currentImgIndex], resizedImgs[currentImgIndex],
                        {
                            quality: 3,
                            alpha: false,
                            unsharpAmount: 0,
                            unsharpRadius: 0.5,
                            unsharpThreshold: 0
                        },
                        callback);
                } else {
                    // Prepare the image data to be sent to the server.
                    var imgDataUrls = [];
                    for (var i = 0; i < imgCount; ++i) {
                        imgDataUrls.push(resizedImgs[i].toDataURL("image/jpeg"));
                    }

                    var request = getBasicRequestObj();
                    request.imgs = imgDataUrls;
                    request.generalCaption = $("#generalCaption").val().replace("\n", "<br/>");

                    // To the server!
                    $.ajax({
                        url: "/upload",
                        type: "POST",
                        data: JSON.stringify(request),
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: function (result) {
                            alert(result.msg);
                        },
                        error: function (req, status, error) {
                            alert("Error! " + req + " || " + status + " || " + error);
                        }
                    });
                }
            }

            pica.resizeCanvas(origImgs[currentImgIndex], resizedImgs[currentImgIndex],
                {
                    quality: 3,
                    alpha: false,
                    unsharpAmount: 0,
                    unsharpRadius: 0.5,
                    unsharpThreshold: 0
                },
                callback);
        }
    }
}

function onLogin() {
    var user = $("#username").val();
    var pwd = $("#pwd").val();

    $.ajax({
        url: "/login",
        type: "POST",
        data:
        JSON.stringify({
            user: user,
            pwd: pwd
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            toggleLoginPanel(false);
            saveUserInfoToCookies(user, pwd);
        }
    });
}

function onLogout() {
    clearUserInfoFromCookies();
    toggleLoginPanel(true);
}

function onTest() {
    var request = getBasicRequestObj();
    $.ajax({
        url: "/test",
        type: "POST",
        data:
        JSON.stringify(request),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            alert(result.msg);
        },
        error: function (req, status, error) {
            alert("Error! " + req + " || " + status + " || " + error);
        }
    });
}

function getBasicRequestObj() {
    var user = {};
    user.user = Cookies.get("user");
    user.pwd = Cookies.get("pwd");
    user.isValid = function () {
        return user.user && user.pwd;
    };

    return user;
}

function saveUserInfoToCookies(user, pwd) {
    Cookies.set("user", user);
    Cookies.set("pwd", pwd);
}

function clearUserInfoFromCookies() {
    Cookies.remove("user");
    Cookies.remove("pwd");
}

function toggleLoginPanel(is_enabled) {
    if (is_enabled) {
        $("#loginPanel").show();
        $("#logoutPanel").hide();
        $("#operationPanel").hide();
        $("#previewPanel").hide();
        $("#generalCaptionPanel").hide();
    } else {
        $("#loginPanel").hide();
        $("#logoutPanel").show();
        $("#operationPanel").show();
        $("#previewPanel").show();
        $("#generalCaptionPanel").show();
    }
}

$(function () {
    var user = Cookies.get("user");
    var pwd = Cookies.get("pwd");

    toggleLoginPanel(!user || !pwd);
});