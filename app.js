const express = require("express");
const app = express();
const expressEjsLayout = require("express-ejs-layouts");
const path = require("path");
const WalletCoreAPI = require('./walletCoreAPI');
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


app.set("view engine", "ejs");
app.set("layout", "layouts/layout");
app.use(expressEjsLayout);
app.use(express.static(path.join(__dirname, "/public")));



app.get('/callback/:currency', async (req, res) => {
    const currency = req.params.currency;
    try {
        const callbackAddress = await theCallback(currency);
        // console.log({"currency": currency, "address": callbackAddress.address });
        res.json({"currency": currency, "address": callbackAddress.address });
    } catch (error) {
        res.json({"Error": error.message});
    }
});
app.use("/", require("./routes/index"));






app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log("SERVER STARTED");
})