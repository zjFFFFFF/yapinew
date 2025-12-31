const yapi = require('../yapi')

const crypto = require('crypto');

/*
 下面是使用加密算法
*/

// 创建加密算法
const aseEncode = function(data, password) {
  const key = crypto.scryptSync(password, 'salt', 24);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-192-cbc', key, iv);
  let crypted = cipher.update(data, 'utf-8', 'hex');
  crypted += cipher.final('hex');
  return iv.toString('hex') + crypted;
};

// 创建解密算法
const aseDecode = function(data, password) {
  if (data.length < 32) {
    return '';
  }
  const iv = Buffer.from(data.substring(0, 32), 'hex');
  const encrypted = data.substring(32);
  const key = crypto.scryptSync(password, 'salt', 24);
  const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}; 

const defaultSalt = 'abcde';

exports.getToken = function getToken(token, uid){
  if(!token)throw new Error('token 不能为空')
  yapi.WEBCONFIG.passsalt = yapi.WEBCONFIG.passsalt || defaultSalt;
  return aseEncode(uid + '|' + token, yapi.WEBCONFIG.passsalt)
}

exports.parseToken = function parseToken(token){
  if(!token)throw new Error('token 不能为空')
  yapi.WEBCONFIG.passsalt = yapi.WEBCONFIG.passsalt || defaultSalt;
  let tokens;
  try{
    tokens = aseDecode(token, yapi.WEBCONFIG.passsalt)
  }catch(e){}  
  if(tokens && typeof tokens === 'string' && tokens.indexOf('|') > 0){
    tokens = tokens.split('|')
    return {
      uid: tokens[0],
      projectToken: tokens[1]
    }
  }
  return false;
  
}

