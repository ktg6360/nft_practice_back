// test.js
const Caver = require('caver-js');
const caver = new Caver('https://api.baobab.klaytn.net:8651/');

async function signTransaction() {
  // Add a keyring to caver.wallet
  const keyring = caver.wallet.keyring.createFromPrivateKey('0x7760a51ac39a7ea6ffda641c5e1835b58bb7e6ad3be2608688bf3a07adf014fb');
  caver.wallet.add(keyring);

  // Create a value transfer transaction
  const valueTransfer = caver.transaction.valueTransfer.create({
    from: keyring.address,
    to: '0x176ff0344de49c04be577a3512b6991507647f72',
    value: 1,
    gas: 30000,
  });

  // Sign the transaction via caver.wallet.sign
  await caver.wallet.sign(keyring.address, valueTransfer);

  const rlpEncoded = valueTransfer.getRLPEncoding();
  console.log(`RLP-encoded string: ${rlpEncoded}`);
}

signTransaction();