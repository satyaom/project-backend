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
        data: Buffer,
    }
});

module.exports = mongoose.model('fileinfo', PostSchema);