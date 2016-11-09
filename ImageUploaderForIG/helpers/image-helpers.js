module.exports = {
    saveImgDataUrl: function (file_name, imgDataUrl) {
        var fs = require("fs");
        var ext = imgDataUrl.split(";")[0].match(/jpeg|png|gif/)[0];

        var matches = imgDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        var data = imgDataUrl.replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer(data, "base64");

        fs.writeFile(file_name + "." + ext, buf);
    }
};