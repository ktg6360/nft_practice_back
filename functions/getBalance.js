const Caver = require('caver-js');
const caver = new Caver('https://api.baobab.klaytn.net:8651/');
const { pkey, addr } = require("./secret.js");

// 잔고 확인
const temp = caver.klay.accounts.createWithAccountKey(addr, pkey);
caver.klay.accounts.wallet.add(temp);
const acc = caver.klay.accounts.wallet.getAccount(0);

async function getBalance() {
  const peb = await caver.klay.getBalance(addr);
  const klay = caver.utils.fromPeb(peb, "KLAY");
  console.log("peb: ", peb);
  console.log("KLAY: ", klay);
}

getBalance();
