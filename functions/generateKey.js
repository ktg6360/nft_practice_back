const Caver = require('caver-js');
const caver = new Caver('https://api.baobab.klaytn.net:8651/');
const { pkey, addr } = require("./secret.js");

// 키 생성
async function generateKey() {
  const keyring = caver.wallet.keyring.generate();
  console.log(keyring);
}

generateKey();
