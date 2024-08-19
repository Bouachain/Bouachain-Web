const express = require("express");
const app = express();
const expressEjsLayout = require("express-ejs-layouts");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const WalletCoreAPI = require('./walletCoreAPI');
const QRCode = require('qrcode');
const walletCore = new WalletCoreAPI();
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
app.use("/", require("./routes/index"));






app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log("SERVER STARTED");
})