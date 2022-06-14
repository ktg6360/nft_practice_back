require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');

const port = process.env.PORT;
const router = require('./router/routes');
const CaverExtKas = require('caver-js-ext-kas');
const caver = new CaverExtKas();
const pinataSDK = require('@pinata/sdk');
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
const pinata = pinataSDK(pinataApiKey, pinataSecretApiKey);
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'database/images'); // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // cb 콜백함수를 통해 전송된 파일 이름 설정
  }
});
const upload = multer({ storage: storage });

// chain-id: 8217 or 1001 => Cypress(Klaytn 메인넷) 또는 Baobab(Klaytn 테스트넷)
const chainId = 1001;
const accessKey = process.env.ACCESSKEY;
const secretKey = process.env.SECRETKEY;
const myWalletAddress = '0xa8aDf8e26B64c249f97b55A4fD1267C12Bf87B91';

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
  res.send(result);
});


// Klaytn 계정 조회
app.get('/getAccount', async (req, res) => {
  const result = await caver.kas.wallet.getAccount(myWalletAddress);
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
app.post('/deployContract', async (req, res) => {
  try {
    const deploy = await caver.kas.kip17.deploy('Bzznbyd Birds Project', 'BZBP', 'bzznbyd-birds-project');
    res.json({
      success: true,
      msg: '저장소 만들기 성공!',
      deploy: deploy
    });
  } catch (error) {
    console.error(error);
  }
});


// 컨트랙트 리스트
app.get('/getContractList', async (req, res) => {
  try {
    const result = await caver.kas.kip17.getContractList();
    res.json(result);
  } catch (error) {
    console.error(error);
  }
});


// 토큰 발행(민팅)
app.post('/mint', async (req, res) => {
  try {
    const tokenId = req.body.tokenId;
    const num = Number(tokenId);
    const tokenId16 = num.toString(16);
    const mint = await caver.kas.kip17.mint('bzznbyd-birds-project', myWalletAddress, `0x${tokenId16}`, `ipfs://QmYK7YaZ9Abw7XVBTKseqURuSZJa9Eh8hzZRNoyTYNRUzA/${tokenId}.json`);
    res.json({
      success: true,
      msg: '민팅 성공!',
      mint: mint
    });

  } catch (error) {
    console.error(error);
  }
});


// 토큰 리스트
app.get('/getTokenList', async (req, res) => {
  try {
    const result = await caver.kas.kip17.getTokenList('bzznbyd-birds-project');
    res.json(result.items);

  } catch (error) {
    console.error(error);
  }
});


// blockNumber 로 block 불러오기
app.get('/getBlock', (req, res) => {
  caver.klay.getBlock(91380036).then(console.log);
  res.send('block 가져오기 성공!');
});


//transfer
app.post('/transfer', (req, res) => {
  const userId = req.body.userId;
  const tokenId = req.body.tokenId;
  const tokenId16 = tokenId.toString(16);

  fs.readFile('./database/users.json', async (err, data) => {
    if (err) throw err;
    const users = JSON.parse(data);
    const user = users.filter(user => user.id === userId);
    const address = user[0].wallet.address;

    try {
      const result = await caver.kas.kip17.transfer('bzznbyd-birds-project', myWalletAddress, myWalletAddress, `${address}`, `0x${tokenId16}`);

      res.json({
        success: true,
        msg: '나에게로 전송 성공!',
        result: result
      });

    } catch (error) {
      console.error(error);
    }
  });
});


//getTransactionByHash
app.get('/getTransactionByHash', async (req, res) => {
  try {
    const hash = req.query.hash;
    const result = await caver.rpc.klay.getTransactionByHash(hash);
    res.json({
      success: true,
      msg: '가져오기 성공!',
      result: result
    });

  } catch (error) {
    console.error(error);
  }
});


// 트랜잭션 추가
app.post('/addHash', (req, res) => {
  fs.readFile('./database/users.json', async (err, data) => {
    if (err) throw err;
    const users = JSON.parse(data);
    const id = req.body.userId;
    const hash = req.body.hash;
    const tokenId = req.body.tokenId;

    users.forEach(user => {
      if (user.id === id) {
        if (user.transactionHash) {
          user.transactionHash.push({
            hash,
            tokenId
          });
        } else {
          user.transactionHash = [{
            hash,
            tokenId
          }];
        }
      }
    });

    fs.writeFile('./database/users.json', JSON.stringify(users), (err, result) => {
      if (err) throw err;
      res.json({
        success: true,
        msg: "트랜잭션 추가 성공"
      });
    });
  });
});


// 이미지 업로드
app.post('/upload', upload.single('file'), async (req, res) => {
  console.log(1111, req.file, req.body);
  res.json({
    success: true,
    msg: '등록 성공!'
  });
});


// 피나타
app.post('/pinata', async (req, res) => {
  const userId = req.body.userId;
  const fileName = req.body.fileName;

  try {
    const fs = require('fs');
    const readableStreamForFile = fs.createReadStream(`database/images/${fileName}`);
    const optionsForImage = {
      pinataMetadata: {
        name: `${userId}-nft-image`,
        keyvalues: {
          customKey: 'customValue',
          customKey2: 'customValue2'
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };

    const result = await pinata.pinFileToIPFS(readableStreamForFile, optionsForImage);

    const name = `${userId} 버즈앤비 NFT`;
    const description = "This is NFT made by Bzznbyd";
    const ipfs = result.IpfsHash;
    const date = Date.now();

    const body = {
      name: name,
      description: description,
      image: `ipfs://${ipfs}`,
      date: date
    };

    const optionsForJson = {
      pinataMetadata: {
        name: `${userId}-nft-json`,
        keyvalues: {
          customKey: 'customValue',
          customKey2: 'customValue2'
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    };

    const resultForJson = await pinata.pinJSONToIPFS(body, optionsForJson);

    res.json({
      success: true,
      msg: '메타데이터 생성 성공!',
      result: resultForJson,
      metaData: body
    });

  } catch (error) {
    console.error(error);
  }
});


// 나만의 컨트랙트 배포
app.post('/deployMyContract', async (req, res) => {
  try {
    const userId = req.body.userId;
    const userIdInLowerCase = userId.toLowerCase();
    const deploy = await caver.kas.kip17.deploy(`Bzznbyd NFT ${userId}`, 'BZNU', `bzznbyd-nft-${userIdInLowerCase}`);
    res.json({
      success: true,
      msg: '저장소 만들기 성공!',
      deploy: deploy
    });

  } catch (error) {
    console.error(error);
  }
});


// 나만의 토큰 발행(민팅)
app.post('/mintMyNFT', async (req, res) => {
  try {
    const userId = req.body.userId;
    const userIdInLowerCase = userId.toLowerCase();
    const ipfsHash = req.body.ipfsHash;

    fs.readFile('./database/users.json', async (err, data) => {
      if (err) throw err;
      const users = JSON.parse(data);
      const user = users.filter(user => user.id === userId);
      const address = user[0].wallet.address;

      const mint = await caver.kas.kip17.mint(`bzznbyd-nft-${userIdInLowerCase}`, `${address}`, `0x1`, `ipfs://${ipfsHash}`);
      res.json({
        success: true,
        msg: '민팅 성공!',
        mint: mint
      });
    });

  } catch (error) {
    console.error(error);
  }
});


// myNFT 트랜잭션 추가
app.post('/addMyNFTHash', (req, res) => {
  fs.readFile('./database/users.json', async (err, data) => {
    if (err) throw err;
    const users = JSON.parse(data);
    const id = req.body.userId;
    const hash = req.body.hash;
    const tokenId = req.body.tokenId;

    users.forEach(user => {
      if (user.id === id) {
        if (user.transactionHashForMyNFT) {
          user.transactionHashForMyNFT.push({
            hash,
            tokenId
          });
        } else {
          user.transactionHashForMyNFT = [{
            hash,
            tokenId
          }];
        }
      }
    });

    fs.writeFile('./database/users.json', JSON.stringify(users), (err, result) => {
      if (err) throw err;
      res.json({
        success: true,
        msg: "트랜잭션 추가 성공"
      });
    });
  });
});




app.listen(port, () => {
  console.log('서버 구동중입니다!');
});
