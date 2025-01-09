const express = require('express');
const router = express.Router();

router.get("/", (req, res) => {
    res.render("home");
});
router.get("/brand", (req, res) => {
    res.render("brand");
});

router.get("/presale", (req, res) => {
    res.render("presale");
});
router.get("/airdrop", (req, res) => {
    res.render("airdrop");
});

module.exports = router;