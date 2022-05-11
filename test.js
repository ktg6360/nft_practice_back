require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');

const port = process.env.PORT;
const router = require('./router/routes');
const Caver = require('caver-js');
const caver = new Caver('https://api.baobab.klaytn.net:8651/');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// 버전 확인하기
app.get('/version', async (req, res) => {
  const version = await caver.rpc.klay.getClientVersion();
  console.log(version);

  res.json({ version: version });
});


// 최신 블럭 확인하기
app.get('/block', async (req, res) => {
  const block = await caver.klay.getBlockNumber();
  if (block) {
    console.log('성공 block' + block);
    res.send('성공 block' + block);
  }
});


// 계정 만들기
app.get('/createAccount', async (req, res) => {
  // 계정을 만드는 함수
  const account = await caver.klay.accounts.create();
  console.log(account);

  // 개인키 또는 계정 객체를 사용하여 계정을 지갑에 추가해주는 함수
  const create = await caver.klay.accounts.wallet.add(account);
  console.log(create);
  res.send(create);
});


// 계정 존재유무를 확인 => 존재하면 true, 아니면 false 반환
app.get('/existAccount', async (req, res) => {
  const exist = await caver.klay.accountCreated(process.env.ADDRESS);
  console.log(exist);
  res.send(exist);
});


// 클레이 전송하기
app.post('/sendKlay', async (req, res) => {
  // 전송받을 계정
  const to = req.body.toAddress;
  // 전송할 클레이 양
  const value = req.body.amount;

  // 클레이를 전송할 계정 잔고 확인
  const peb = await caver.klay.getBalance(process.env.ADDRESS);
  const balance = caver.utils.fromPeb(peb, 'KLAY');
  console.log('balance: ', balance);
  console.log('value: ', value);

  // 클레이를 전송받을 계정이 존재하는지 확인
  const check = await caver.klay.accountCreated(to);
  console.log('계정존재유무: ', check);

  if (check && balance > value) {
    const keyring = caver.wallet.keyring.createFromPrivateKey(process.env.PRIVATE_KEY);
    const valueTransfer = caver.transaction.valueTransfer.create({
      from: keyring.address,
      to: to,
      value: caver.utils.toPeb(value, 'KLAY'),
      gas: 30000,
    });

    const signed = await valueTransfer.sign(keyring);

    const receipt = await caver.rpc.klay.sendRawTransaction(signed);
    console.log('receipt: ', receipt);
    res.send(receipt);

  } else {
    res.status(400).send('금액이 초과했거나 존재하지 않는 계정입니다. 다시 확인해주세요!');
  }
});


// blockNumber 로 block 불러오기
app.get('/getBlock', (req, res) => {
  caver.klay.getBlock(0x55bfaeb).then(console.log);
  res.send('block 가져오기 성공!');
});



app.listen(port, () => {
  console.log('서버 구동중입니다!');
});
