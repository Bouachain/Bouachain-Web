// WalletCoreAPI.js

const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

class WalletCoreAPI {
    constructor() {
        this.privateKey = '';
        this.publicKey = '';
    }

    setup(privateKey, publicKey) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }

    getCallbackAddress(currency, ipnUrl = '') {
        const req = {
            currency: currency,
            ipn_url: ipnUrl,
        };
        return this.apiCall('get_callback_address', req);
    }

    createWithdrawal(amount, currency, address, ipnUrl = '') {
        const req = {
            amount: amount,
            currency: currency,
            address: address,
            ipn_url: ipnUrl,
        };
        return this.apiCall('create_withdrawal', req);
    }

    getHistory(currency = 'ALL') {
        const req = {
            currency: currency,
        };
        return this.apiCall('get_history', req);
    }

    isSetup() {
        return (this.privateKey !== '' && this.publicKey !== '');
    }

    apiCall(cmd, req = {}) {
        return new Promise((resolve, reject) => {
            if (!this.isSetup()) {
                reject(new Error('You have not called the setup function with your private and public keys!'));
                return;
            }

            req.version = 1;
            req.cmd = cmd;
            req.key = this.publicKey;

            const postData = querystring.stringify(req);

            const hmac = crypto.createHmac('sha512', this.privateKey);
            hmac.update(postData);
            const signature = hmac.digest('hex');

            const options = {
                hostname: 'member.walletcore.io',
                port: 443,
                path: '/api.php',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': postData.length,
                    'HMAC': signature
                }
            };

            const request = https.request(options, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (error) {
                        reject(new Error(`Unable to parse JSON result: ${error.message}`));
                    }
                });
            });

            request.on('error', (error) => {
                reject(new Error(`HTTPS request error: ${error.message}`));
            });

            request.write(postData);
            request.end();
        });
    }
}

module.exports = WalletCoreAPI;