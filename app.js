require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');

const port = process.env.PORT;
const router = require('./router/routes');
const CaverExtKas = require('caver-js-ext-kas');
const caver = new CaverExtKas();

// chain-id: 8217 or 1001 => Cypress(Klaytn 메인넷) 또는 Baobab(Klaytn 테스트넷)
const chainId = 1001;
const accessKey = process.env.ACCESSKEY;
const secretKey = process.env.SECRETKEY;

caver.initKASAPI(
  chainId,
  accessKey,
  secretKey,
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Klaytn 계정 생성
app.get('/createAccount', async (req, res) => {
  const result = await caver.kas.wallet.createAccount();
  console.log(result);
  res.send(result);
});


// Klaytn 계정 조회
app.get('/getAccount', async (req, res) => {
  const result = await caver.kas.wallet.getAccount('0x3F00dDAD226E05Bd53180942deE4919d0bba9a2A');
  console.log(result);
  res.send(result);
});


// users 정보 불러오기
app.get('/users', async (req, res) => {
  fs.readFile('./database/users.json', (err, data) => {
    if (err) throw err;
    const users = JSON.parse(data);
    res.send(users);
  });
});


// user 정보 불러오기
app.get('/user', async (req, res) => {
  const userId = req.query.userId;

  fs.readFile('./database/users.json', (err, data) => {
    if (err) throw err;
    const users = JSON.parse(data);
    const user = users.filter(user => user.id === userId);
    res.send(user);
  });
});


// 회원가입
app.post('/signUp', (req, res) => {
  fs.readFile('./database/users.json', (err, data) => {
    if (err) throw err;
    const users = JSON.parse(data);
    const id = req.body.id;
    const password = req.body.password;
    const newUser = {
      id,
      password
    };

    users.push(newUser);
    fs.writeFile('./database/users.json', JSON.stringify(users), (err, result) => {
      if (err) throw err;
      res.json({
        success: true,
        msg: "회원가입 성공"
      });
    });
  });
});


// 지갑 추가
app.post('/createWallet', (req, res) => {
  fs.readFile('./database/users.json', async (err, data) => {
    if (err) throw err;
    const users = JSON.parse(data);
    const wallet = await caver.kas.wallet.createAccount();
    const id = req.body.id;
    users.forEach(user => {
      if (user.id === id) {
        user.wallet = wallet;
      }
    });

    fs.writeFile('./database/users.json', JSON.stringify(users), (err, result) => {
      if (err) throw err;
      res.json({
        success: true,
        msg: "지갑추가 성공",
        wallet: wallet
      });
    });
  });
});


// balance 조회
app.get('/getBalance', async (req, res) => {
  const address = req.query.address;
  const peb = await caver.klay.getBalance(address);
  const balance = caver.utils.fromPeb(peb, 'KLAY');
  res.json({
    success: true,
    msg: "Balace 조회 성공",
    balance: balance
  });
});


// 클레이 전송하기
app.post('/sendKlay', async (req, res) => {
  const from = req.body.fromAddress;
  const to = req.body.toAddress;
  const value = req.body.amount;

  // 클레이를 전송할 계정 잔고 확인
  const peb = await caver.klay.getBalance(from);
  const balance = caver.utils.fromPeb(peb, 'KLAY');
  console.log('balance: ', balance);
  console.log('value: ', value);

  const tx = {
    from: from,
    to: to,
    value: caver.utils.toPeb(value, 'KLAY'),
    gas: 25000,
    memo: 'memo',
    submit: true
  };

  try {
    const result = await caver.kas.wallet.requestValueTransfer(tx);

    res.json({
      success: true,
      msg: '전송 성공!',
      transaction: result
    });

  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      msg: '금액이 초과했거나 존재하지 않는 계정입니다. 다시 확인해주세요.'
    });
  }
});


// 컨트랙트 배포
app.post('/deploy', async (req, res) => {
  try {
    const result = await caver.kas.kip17.deploy('cucumber KIP-17', 'BZZT', 'cucumber-bzznbyd-token');
    res.json(result);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
});


// 컨트랙트 리스트
app.get('/getContractList', async (req, res) => {
  try {
    const result = await caver.kas.kip17.getContractList();
    res.json(result);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
});


// 토큰 발행(민팅)
app.post('/mint', async (req, res) => {
  try {
    const mint = await caver.kas.kip17.mint('cucumber-bzznbyd-token', '0x3F00dDAD226E05Bd53180942deE4919d0bba9a2A', '0x1', 'ipfs://QmZvscF7Ntt2wgxn2NUdzwp3XGpFkXYdEAS22pJBL1Krec/3.json');
    res.json(mint);
    console.log('mint: ', mint);
  } catch (error) {
    console.error(error);
  }
});


// 토큰 리스트
app.get('/getTokenList', async (req, res) => {
  try {
    const userId = req.query.userId;
    console.log(userId);
    const result = await caver.kas.kip17.getTokenList(`${userId}-bzznbyd-token`);
    console.log(result.items);
    res.json(result.items);
  } catch (error) {
    console.error(error);
  }
});


app.listen(port, () => {
  console.log('서버 구동중입니다!');
});
