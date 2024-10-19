const express = require("express");
const app = express();
const expressEjsLayout = require("express-ejs-layouts");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const WalletCoreAPI = require('./walletCoreAPI');
const QRCode = require('qrcode');
const walletCore = new WalletCoreAPI();
const axios = require('axios');
const Purchase = require('./models/purchase.js');
const mongoose = require('mongoose');
const crypto = require('crypto');
const cron = require('node-cron');
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { SigningStargateClient, StargateClient } = require("@cosmjs/stargate");
require('dotenv').config();
// const BOT_TOKEN = '';


mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to MongoDB');
});



// async function triggerSmartContract(bouaWallet, amount) {
//   const rpcEndpoint = "https://RPC.bouachain.com";  // Replace with your Bouachain RPC endpoint
//   const mnemonic = "your mnemonic here"; // Replace with your wallet mnemonic
//   const contractAddress = "boua1suhgf5svhu4usrurvxzlgn54ksxmn8gljarjtxqnapv8kjnp4nrs6gd5gr"; // Replace with your smart contract address

//   const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'boua' });
//   const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);
//   const account = (await wallet.getAccounts())[0];

//   const msg = {
//     distribute_tokens: {
//       recipient: bouaWallet, // The recipient's Bouachain address
//       amount: amount,        // Amount to send (in smallest units, e.g., ubouacoin)
//     },
//   };

//   const fee = {
//     amount: [{ denom: "bouacoin", amount: "1000" }], // Adjust the fee if needed
//     gas: "200000",  // Adjust the gas limit based on the contract execution
//   };

//   try {
//     const result = await client.execute(account.address, contractAddress, msg, fee, "Distribute Tokens");
//     assertIsBroadcastTxSuccess(result);
//     console.log("Tokens distributed successfully!");
//     return true;
//   } catch (error) {
//     console.error("Failed to distribute tokens:", error);
//     return false;
//   }
// }

async function transferTokens(recipientAddress, amount) {
  // Configuration
  const rpcEndpoint = "https://rpc.bouachain.com"; // Replace with actual RPC endpoint
  const privateKey = process.env.PRIVATEKEY;
  const contractAddress = "boua14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s9appq2";

  try {
    // Create a wallet instance
    const wallet = await DirectSecp256k1HdWallet.fromKey(
      Buffer.from(privateKey, "hex"),
      "boua" // Replace with the actual prefix for Bouachain addresses
    );

    // Get the sender's address
    const [account] = await wallet.getAccounts();
    const senderAddress = account.address;

    // Create a signing client
    const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);

    // Prepare the message for the smart contract
    const msg = {
      transfer: {
        recipient: recipientAddress,
        amount: amount.toString(),
      },
    };

    // Execute the contract
    const result = await client.execute(
      senderAddress,
      contractAddress,
      msg,
      "auto", // fee
      "Transferring tokens" // memo
    );

    console.log("Transfer successful!");
    console.log("Transaction hash:", result.transactionHash);
    return result;
  } catch (error) {
    console.error("Error transferring tokens:", error);
    throw error;
  }
}


walletCore.setup('sjnpD7mrZCXfwbclFo3hQ6Kz4GI8ek1J', '626049e76ce0085aeb9c8de1b2bdbaad');
async function theCallback(currency) {
  try {
    const callbackAddress = await walletCore.getCallbackAddress(currency);
    // console.log('Callback Address:', callbackAddress);
    return callbackAddress
  } catch (error) {
    console.error('Error:', error.message);
    return error.message
  }
}

function walletAddressToQRCode(walletAddress) {
  return new Promise((resolve, reject) => {
    // Generate a unique filename
    const filename = `qr-${uuidv4()}.svg`;
    const filepath = path.join(__dirname, '/public/qr-codes', filename);

    // Ensure the directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Generate QR code
    QRCode.toString(walletAddress, { type: 'svg' }, (err, svg) => {
      if (err) {
        reject(err);
      } else {
        // Write SVG to file
        fs.writeFile(filepath, svg, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(filename);
          }
        });
      }
    });
  });
}


app.set("view engine", "ejs");
app.set("layout", "layouts/layout");
app.use(expressEjsLayout);
app.use(express.static(path.join(__dirname, "/public")));

let price = {
  'ETH': 1,
  'SOL': 2,
  'LTC': 3,
  'BNB': 4,
  'TRX': 5,
  'USDT': 6,
  'DASH': 7,
  'BUSD': 8,
  'BTC': 9,
  'BTT': 10,
  'DOGE': 11
};

// Function to fetch real-time prices from CoinGecko
async function fetchPrices() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'ethereum,solana,litecoin,binancecoin,tron,tether,dash,binance-usd,bitcoin,bittorrent,dogecoin',
        vs_currencies: 'usd'
      }
    });

    const data = response.data;

    price = {
      'ETH': data.ethereum.usd,
      'SOL': data.solana.usd,
      'LTC': data.litecoin.usd,
      'BNB': data.binancecoin.usd,
      'TRX': data.tron.usd,
      'USDT': data.tether.usd,
      'DASH': data.dash.usd,
      'BUSD': data['binance-usd'].usd,
      'BTC': data.bitcoin.usd,
      'BTT': data.bittorrent.usd,
      'DOGE': data.dogecoin.usd
    };

    console.log('Prices updated successfully');
  } catch (error) {
    console.error('Error fetching prices:', error.message);
  }
}

// Schedule price update every 24 hours
cron.schedule('0 0 * * *', fetchPrices);

// Fetch prices immediately on server start
fetchPrices();

// Route to get the latest prices
app.get('/prices', (req, res) => {
  res.json(price);
});

app.get('/callback/:currency', async (req, res) => {
  const currency = req.params.currency;
  try {
    const callbackAddress = await theCallback(currency);
    async function generateQRCode() {
      try {
        const walletAddress = callbackAddress.address;
        const qrCodePath = await walletAddressToQRCode(walletAddress);
        //   console.log(`QR code generated: ${qrCodePath}`); 
        return qrCodePath;
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }
    const imgUrl = await generateQRCode();
    res.json({ "currency": currency, "address": callbackAddress.address, "url": "/qr-codes/" + imgUrl });
  } catch (error) {
    res.json({ "Error": error.message });
  }
});

app.get('/confirm/:walletAddress/:tokenType/:amount/:totalrecieve/:bouawallet', async (req, res) => {
  const DEBANK_API_KEY = '4e3d811fc66644d3688e1e56cd75b5a29c79cc81';
  const userWalletAddress = req.params.walletAddress;
  const tokenType = req.params.tokenType.toLowerCase();
  const expectedAmount = parseFloat(req.params.amount);

  async function checkPayment(walletAddress, tokenType) {
    if(tokenType == 'bnb'){
      tokenType = 'bsc';
    }
    try {
      const response = await axios.get(
        `https://pro-openapi.debank.com/v1/user/token_list?id=${walletAddress}&chain_id=${tokenType}`,
        {
          headers: {
            'AccessKey': DEBANK_API_KEY
          }
        }
      );

      console.log('API Response:', response.data);

      const balances = response.data;

      for (let token of balances) {
        if (token.chain === tokenType.toLowerCase() && token.symbol === tokenType.toUpperCase()) {
          return parseFloat(token.amount);
        }
      }

      return 0; // If no balance is found, return 0
    } catch (error) {
      console.error('Error checking payment:', error.response ? error.response.data : error.message);
      return 0;
    }
  }

  async function verifyPayment() {
    try {
      const balance = await checkPayment(userWalletAddress, tokenType);

      if (balance >= expectedAmount) {
        console.log('Payment verified:', balance);
        try {
          const purchaseData = {
            wallet: req.params.walletAddress,
            bouaWallet: req.params.bouawallet,
            paymentToken: req.params.tokenType,
            paymentAmount: parseFloat(req.params.amount),
            bouacoin: parseFloat(req.params.totalrecieve)
          };

          const newPurchase = new Purchase(purchaseData);
          await newPurchase.save();

          console.log('Purchase data saved successfully', newPurchase);
        } catch (error) {
          console.error('Error saving purchase data:', error);
        }

        // await triggerSmartContract(req.params.bouawallet, req.params.totalrecieve);
        transferTokens(req.params.bouawallet, req.params.totalrecieve)
          .then((result) => console.log(result))
          .catch((error) => console.error(error));
        res.json({ success: true, message: 'Payment verified', balance: balance });

      } else {
        console.log('Payment not found or insufficient');
        res.json({ success: false, message: 'Payment not found or insufficient', balance: balance });
      }
    } catch (error) {
      console.error('Error in verifyPayment:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  await verifyPayment();
});


// app.post('/auth/telegram', (req, res) => {
//   const { hash, ...userData } = req.body;
// console.log(req);
//   const dataCheckString = Object.keys(userData)
//     .sort()
//     .map(key => `${key}=${userData[key]}`)
//     .join('\n');

//   const secretKey = crypto.createHash('sha256')
//     .update(BOT_TOKEN)
//     .digest();

//   const hmac = crypto.createHmac('sha256', secretKey)
//     .update(dataCheckString)
//     .digest('hex');

//   if (hmac === hash) {
//     // Authentication successful
//     res.json({ success: true, user: userData });
//   } else {
//     // Authentication failed
//     res.status(401).json({ success: false });
//   }
// });





app.use("/", require("./routes/index"));






app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log("SERVER STARTED");
})