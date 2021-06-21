const express = require('express');
const user = express.Router();
const fs = require('fs')
const multer = require('multer')
const keypair = require('keypair');
var sha256 = require('sha256')
const {check, validationResult} = require('express-validator');
const generateToken = require('../tools/gen_token');
const conSql = require('../DB/connection_sql');
const jwt = require('jsonwebtoken')
const qrcode = require('qrcode');
require('dotenv/config');
//require schema
const Post = require('../model/post');
const { query } = require('../DB/connection_sql');
const crypto = require('crypto');

//multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, 'uploads');
    },
    filename: (req, file, cb)=>{
        cb(null, new Date().toISOString() + file.originalname);
    }
});

//multer instance
const upload  = multer({
    storage: storage, 
    limits: {
        fileSize: 1024*1024*5
    },
});

//to verify token
const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies.token || '';
      if (!token) {
        return res.status(401).json('You need to Login')
      }
      const decrypt = await jwt.verify(token, process.env.JWT_SECRET);
      req.usr = {
        id: decrypt.id,
        firstname: decrypt.firstname,
      };
      next();
    } catch (err) {
      return res.status(500).json(err.toString());
    }
  };




//logout
user.get('/logout', verifyToken, (req, res)=>{
    //it will clear the userData cookie
    res.clearCookie('token');
    res.json({message:'user logout successfully'});
    });



//home
user.get('/', verifyToken, async (req, res) => {
    console.log(req.usr);
    res.json({id: req.usr.id, firstname: req.usr.firstname});
})



//for login
user.post('/login', [
    check('email').isEmail().not().isEmpty().escape().normalizeEmail(),
    check('password').not().isEmpty().escape(),
],
(req, res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    user_email = req.body.email;
    user_password = req.body.password;
    if (user_email.length != 0) {
        hashPass = sha256(user_password);
        var sql = `select * from login where email_id like ?`;
        conSql.query(sql, [user_email], (err, result)=>{
            if (err) {
                console.log(err.message);
            }
            else if(result.length == 0) {
                res.status(400).json({message:'wrong password and email'});
            } else {
                if(result[0].password == hashPass) {
                    var qe = `select * from detail where token_id = "${result[0].token_id}"`;
                    conSql.query(qe, async (err, rslt) => {
                        if(err) {
                            console.log(err.message);
                        } else {
                            await generateToken(res, rslt[0].token_id, rslt[0].name);
                            res.json({message:'done'});
                        }
                    })
                } else {
                    res.status(400).json({message:'wrong password and email'});
                }
            }
        });
    } else {
        res.status(400).json({message:'invalid input'});
    }
});



//post request for signup
user.post('/signup', [
    check('name').not().isEmpty().escape().trim(),
    check('email').not().isEmpty().isEmail().escape().normalizeEmail(),
    check('password').not().isEmpty().escape(),
  ],
(req, res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    user_email = req.body.email;
    user_password = req.body.password;
    user_name = req.body.name;

    tokenId = sha256(user_email);
    var sql = `select * from login where email_id like ?`;
    conSql.query(sql, [user_email], (err, result)=>{
        if (err) {
            console.log(err.message);
        } else if(result.length == 0) {
            var sql = `insert into login values("${tokenId}", ?, ?)`;
            var sql_user = `insert into detail values("${tokenId}", ?)`;
            var pair = keypair()
            sql_key = `insert into tkey values ("${tokenId}", "${pair.public}", "${pair.private}")`;

            conSql.query(sql_user, [user_name], (err)=>{
                if(err) {
                    console.log(err.message);
                } 
            });

            conSql.query(sql, [user_email, sha256(user_password)], (err)=>{
                if (err) {
                    console.log(err.message)
                } else {
                    res.json({message:'credentials inserted'});
                }
            });

            conSql.query(sql_key, (err)=>{
                if(err) {
                    console.log(err.message);
                } 
            });

        } else {
            res.json({message:'user already exits'});
        }
    });   
});



//to get uploaded file
user.get('/getUploads', verifyToken, async (req, res) => {
    try {
        id = req.usr.id;
        const post = await Post.find({tokenId:req.usr.id});
        
        q1 = `select public_key from tkey where token_id = "${id}"`;``
        q2 = `select dig_sig from document where token_id = "${id}"`;
        let pubkey
        await conSql.query(q1, async (err, rslt) => {
            rr = {
                post: post,
                public_key: rslt[0].public_key,
            }
            res.json(rr);
            await conSql.query(q2, async (err, sig) => {
                // Verify file signature ( support formats 'binary', 'hex' or 'base64')
                for(i= 0; i < sig.length; i++) {
                    doc = post[i].postFile.data;
                    const verifier = crypto.createVerify('RSA-SHA256');
                    verifier.write(doc);
                    verifier.end();
                    const reslt = verifier.verify(rslt[0].public_key, sig[i].dig_sig, 'base64');
                    console.log('Digital Signature Verification of ' +post[i].postFile.name+' is : '+ reslt);
                    await conSql.query(`update document set tempered = ${!reslt} where document_name = "${post[i].fileName}"`)
                }
            }); 
        });
        
    } catch(err) {
        res.status(400).json({ message: err.message })
    }
});



//upload file
user.post('/upload', verifyToken, upload.single('postFile'), async (req, res) => {
    console.log(req.file);
    

    try {
        doc = fs.readFileSync(req.file.path); 
        qry = `select private_key from tkey where token_id = "${req.usr.id}"`;
        await conSql.query(qry, async (err, rslt) => {
            if(err) {
                console.log(err.message);
                res.send(err.message);
            } else {
                private_key = rslt[0].private_key;
                const signer = crypto.createSign('RSA-SHA256');
                signer.write(doc);
                signer.end();

                // Returns the signature in output_format which can be 'binary', 'hex' or 'base64'
                const signature = signer.sign(private_key, 'base64')

                console.log('Digital Signature: ', signature);
                const qr = await qrcode.toDataURL(signature);
                
                //instance of mongoose for schema
                const post = new Post({
                    tokenId: req.usr.id,
                    postFile: {
                        data: doc,
                        contentType: req.file.mimetype,
                        name: req.file.originalname, 
                    },
                    fileName: req.file.filename,
                    qr: {
                        data: qr,
                    }
                });

                sql = `insert into document values ("${req.file.filename}", "${req.usr.id}", "${signature}", false)`;
                
                await post.save();
                await conSql.query(sql);
            } 
        });
        res.status(200).json({message:'done'});
    } catch(err) {
        res.status(400).json({ message: err.message });
    }
});



//change uploaded file
user.get('/updateData', verifyToken, upload.single('postFile'), async (req, res) => {
    number = req.body.number-1;
    const post = await Post.find({tokenId:req.usr.id});
    filename = post[number].fileName;
    doc = fs.readFileSync(req.file.path); 
    id = req.usr.id;
    postFile = {
        data: doc,
        contentType: req.file.mimetype,
        name: req.file.originalname, 
    }
    var conditions = { fileName: filename }
    , update = { $set:{ postFile: postFile}}
    , options = { multi: false };

    Post.updateMany(conditions, update, options, (err, rslt) => {
        if(err) {
            res.json(err.message);
        } else {
            res.json({message:'done'});
        }
    });
});



module.exports = user;