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

mongoose.connect('mongodb+srv://strataone:strataone@cluster0.smav9ja.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB');
});


walletCore.setup('NkDPdltpjH8sBRWUq2ieFr7AgzM5YZab', '471d1553d59094ae3da621d6817866d5');
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
      if (!fs.existsSync(dir)){
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
        res.json({"currency": currency, "address": callbackAddress.address, "url": "/qr-codes/" + imgUrl});
    } catch (error) {
        res.json({"Error": error.message});
    }
});

app.get('/confirm/:walletAddress/:tokenType/:amount/:totalrecieve/:bouawallet', async (req, res) => {
  console.log(req.params);
  const DEBANK_API_KEY = '88ee567fb7a1894b301e0e85b7b2bdaeb99c5a1c';
  const userWalletAddress = req.params.walletAddress;
  const tokenType = req.params.tokenType.toLowerCase();
  const expectedAmount = parseFloat(req.params.amount);

  // Function to get wallet balances
  async function checkPayment(walletAddress, tokenType) {
    try {
      const response = await axios.get(
        `https://pro-openapi.debank.com/v1/user/token_list?id=${walletAddress}`,
        {
          headers: {
            'AccessKey': DEBANK_API_KEY
          }
        }
      );

      const balances = response.data;

      for (let token of balances) {
        switch (tokenType) {
          case 'ETH':
            if (token.chain === 'eth' && token.symbol === 'ETH') {
              return parseFloat(token.amount);
            }
            break;
          case 'SOL':
            if (token.chain === 'sol' && token.symbol === 'SOL') {
              return parseFloat(token.amount);
            }
            break;
          case 'LTC':
            if (token.chain === 'ltc' && token.symbol === 'LTC') {
              return parseFloat(token.amount);
            }
            break;
          case 'BNB':
            if (token.chain === 'bsc' && token.symbol === 'BNB') {
              return parseFloat(token.amount);
            }
            break;
          case 'TRX':
            if (token.chain === 'trx' && token.symbol === 'TRX') {
              return parseFloat(token.amount);
            }
            break;
          case 'BUSD':
            if (token.chain === 'bsc' && token.symbol === 'USDT') {
              return parseFloat(token.amount);
            }
            break;
          case 'USDT':
            if (token.chain === 'eth' && token.symbol === 'USDT') {
              return parseFloat(token.amount);
            }
            break;
          case 'DASH':
            if (token.chain === 'dash' && token.symbol === 'DASH') {
              return parseFloat(token.amount);
            }
            break;
        }
      }

      return 0; // If no balance is found, return 0
    } catch (error) {
      console.error('Error checking payment:', error);
      return 0;
    }
  }

  // Function to verify the payment
  async function verifyPayment() {
    const balance = await checkPayment(userWalletAddress, tokenType);

    if (balance >= expectedAmount) {
      console.log('Payment verified:', balance);

      res.json({ success: true, message: 'Payment verified', balance: balance });
    } else {
      try {
        const purchaseData = {
          wallet: req.params.walletAddress,
          bouaWallet: req.params.bouawallet,
          paymentToken: req.params.tokenType,
          paymentAmount: parseFloat(req.params.amount), // Ensure it is a number
          bouacoin: parseFloat(req.params.totalrecieve) // Ensure it is a number
        };
    
        const newPurchase = new Purchase(purchaseData);
        await newPurchase.save();
    
        console.log({ message: 'Purchase data saved successfully', data: newPurchase });
      } catch (error) {
        console.error('Error saving purchase data:', error);
      }
      console.log('Payment not found or insufficient');
      res.json({ success: false, message: 'Payment not found or insufficient', balance: balance });
    }
  }

  await verifyPayment();
});







app.use("/", require("./routes/index"));






app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log("SERVER STARTED");
})