require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');

const port = process.env.PORT;
const router = require('./router/routes');
const CaverExtKas = require('caver-js-ext-kas');
const caver = new CaverExtKas();

const accessKey = 'KASK4XAQZ0FNKT292VZSCJMZ';
const secretKey = 'QVWQXYAVPK9A9W2Pbb6RZS8PoJJnPEO6KxyOIEdk';

caver.initKASAPI(
  1001,
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
  const result = await caver.kas.wallet.getAccount('0x04d445DCeD078e5Aacf2B698927c62Ae4f59bF12');
  console.log(result);
  res.send(result);
});


// user 정보 불러오기
app.get('/users', async (req, res) => {
  fs.readFile('./database/users.json', (err, data) => {
    if (err) throw err;
    const users = JSON.parse(data);
    console.log(users);
    res.send(users);
  });
});


// 회원가입
app.post('/signUp', async (req, res) => {
  fs.readFile('./database/users.json', (err, data) => {
    if (err) throw err;
    const users = JSON.parse(data);
    const newUser = {
      "id": "Noah1234",
      "name": "Noah",
      "address": "abcdefghijklmnopqrstuvwxyz"
    };
    users.push(newUser);
    fs.writeFile('./database/users.json', JSON.stringify(users), (err, result) => {
      if (err) throw err;
      res.send('회원가입 성공');
    });
  });
});

app.listen(port, () => {
  console.log('서버 구동중입니다!');
});
