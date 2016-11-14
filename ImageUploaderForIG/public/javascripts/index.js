"use strict";

var currentEdittingIndividualCaption = null;

function onSelectedFiles(files) {
    var previewSection = document.getElementById("previewSection");

    previewSection.innerHTML = "";
    var reader = new FileReader();
    var fileCount = files.length;
    var currentFileIndex = 0;

    if (currentFileIndex < fileCount) {
        var callback = function (e) {
            previewSection.innerHTML += "<div class='img raised link ui card'><div class='image'><img src='"
                + reader.result + "'/></div><div class='content'><p class='hiddenCaption'></p></div></div>";

            currentFileIndex++;

            if (currentFileIndex < fileCount) {
                reader.readAsDataURL(files[currentFileIndex]);
            } else {
                $(".img").click(onClickImg);
            }
        };

        reader.onload = callback;
        reader.readAsDataURL(files[currentFileIndex]);
    }
}

function onUpload() {
    var previewSection = document.getElementById("previewSection");

    if (previewSection) {
        var origImgs = previewSection.getElementsByTagName("img");
        var imgCount = origImgs.length;
        var currentImgIndex = 0;

        var resizedImgs = [];
        
        var captionBoxes = $(".hiddenCaption");

        // Create in-memory canvases to resize the images with appropriate sizes.
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

                    var captions = [];
                    for (var i = 0; i < imgCount; ++i) {
                        captions.push($(captionBoxes[i]).html());
                    }

                    var request = getBasicRequestObj();
                    request.imgs = imgDataUrls;
                    request.captions = captions;

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
    var request = getBasicRequestObj();

    $.ajax({
        url: "/logout",
        type: "POST",
        data: JSON.stringify(request),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            clearUserInfoFromCookies();
            toggleLoginPanel(true);
        }
    });
}

function onClickImg(event) {
    var clicked = $(this);
    currentEdittingIndividualCaption = clicked.find(".hiddenCaption");
    var captionForThisImg = currentEdittingIndividualCaption.html().replace(/<br>/g, "\n");

    var captionEditField = $(".ui.modal.captionEditor").find(".individualCaption");
    captionEditField.val(captionForThisImg);

    $(".ui.modal.captionEditor").modal("show");
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
        $(".operationPanel").hide();
        $("#previewPanel").hide();
        $("#generalCaptionPanel").hide();
    } else {
        $("#loginPanel").hide();
        $("#logoutPanel").show();
        $(".operationPanel").show();
        $("#previewPanel").show();
        $("#generalCaptionPanel").show();
    }
}

function onApplyCaptionTemplate() {
    $(".ui.basic.modal.confirmation").modal("show");
}

function onSaveIndividualCaption(ele) {
    var captionEditField = $(".ui.modal.captionEditor").find(".individualCaption");
    currentEdittingIndividualCaption.html(captionEditField.val().replace(/\n/g, "<br>"));
}

function onFinishedEdittingIndividualCaption() {
    currentEdittingIndividualCaption = null;
}

function onConfirmApplyingCaptionTemplate(ele) {
    $(".hiddenCaption").html($("#generalCaption").val().replace(/\n/g, "<br>"));
}

$(function () {
    var user = Cookies.get("user");
    var pwd = Cookies.get("pwd");

    toggleLoginPanel(!user || !pwd);

    $(".ui.modal.captionEditor").modal({
        onApprove: onSaveIndividualCaption,
        blurring: true,
        onHidden: onFinishedEdittingIndividualCaption
    });

    $(".ui.basic.modal.confirmation").modal({
        blurring: true,
        onApprove: onConfirmApplyingCaptionTemplate
    });
});