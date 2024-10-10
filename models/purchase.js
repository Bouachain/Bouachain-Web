const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PurchaseSchema = new Schema({
    wallet: {
        type: String,
        required: true
    },
    bouaWallet: {
        type: String,
        required: true
    },
    paymentToken: {
        type: String,
        required: true,
    },
    paymentAmount: {
        type: Number,
        required: true
    },
    bouacoin: {
        type: Number,
        required: true
    },
    confired: {
        type: Boolean,
        default: false
    },
    sent: {
        type: Boolean,
        default: false
    },
});

const Purchase = mongoose.model('Purchase', PurchaseSchema);

module.exports = Purchase;
