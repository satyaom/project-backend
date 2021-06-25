const mongoose = require('mongoose');

const PostSchema = mongoose.Schema({
    tokenId: {
        type: String,
    },
    postFile: {
        data: Buffer,
        contentType: String,
        name: String,
    },
    fileName: {
        type: String,
    },
    qr: {
        data: String,
    }
});

module.exports = mongoose.model('fileinfo', PostSchema);