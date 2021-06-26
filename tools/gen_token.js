const jwt = require('jsonwebtoken');
//import jwt from 'jsonwebtoken'; 

const generateToken = (res, id, firstname) => {
  const expiration = 1000*60*20;
  const token = jwt.sign({ id, firstname }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
  return res.cookie('token', token, {
    expires: new Date(Date.now() + expiration),
    secure: true, // set to true if your using https
    httpOnly: true,
    sameSite: "None",
  });
};
module.exports = generateToken