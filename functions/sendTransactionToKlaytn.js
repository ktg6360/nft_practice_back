// test.js
const Caver = require('caver-js');
const caver = new Caver('https://api.baobab.klaytn.net:8651/');

async function sendTransactionToKlaytn() {
  const rlpEncoding = `0x08f87e0185ae9f7bcc0082753094176ff0344de49c04be577a3512b6991507647f7201941ac80cce329029e9f34bde86ef16a3dd92e865f9f847f8458207f6a0068bd47e71bfd6a7291dea36dec3964accbec73e8556501c85392ef4e6af6e28a04700966fd06e50b306e5a568686cbf702c7ec710ee6282cf2e9054c8e983f01c`;

  // Send the transaction using `caver.rpc.klay.sendRawTransaction`.
  const receipt = await caver.rpc.klay.sendRawTransaction(rlpEncoding);
  console.log(receipt);
}

sendTransactionToKlaytn();