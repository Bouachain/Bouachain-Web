// CHANGE NAVBAR COLOR ON PAGE SCROLL 
$(document).ready(function () {
    var navbar = $('.navbar');
    var navbarHeight = navbar.outerHeight();

    $(window).scroll(function () {
        if ($(this).scrollTop() > navbarHeight) {
            navbar.css('background-color', 'rgba(255, 255, 255, 1)');
        } else {
            navbar.css('background-color', 'transparent');
        }
    });
});
// COPY BUTTON 
$(document).ready(function() {
    $('#copyButton').on('click', function() {
        var textToCopy = $('#payWallet').text();
        
        navigator.clipboard.writeText(textToCopy).then(function() {
            $('#copyButton').text('Copied!');
            setTimeout(function() {
                $('#copyButton').html('Copy <i class="bi bi-clipboard2-check"></i>');
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy text: ', err);
        });
    });
});
// WALLET REQUEST
$('#fetchButton').on('click', function () {
    const price = {
        'ETH': 1,
        'SOL': 2,
        'LTC': 3,
        'BNB': 4,
        'TRX': 5,
        'USDT': 6,
        'DASH': 7,
        'BUSD': 8
    };
    let totalRecieve = $("#totalBoua").val();
    if (totalRecieve != "") {
        $("#recieveAmmount").html(`${totalRecieve}`);
        let paymentCurrency = $('#currency').val();
        $("#paymentCurrency").html(`${paymentCurrency}`);
        let tokenAmmount = ((totalRecieve * 0.001) / price[paymentCurrency]).toFixed(6);
        $('#payAmmount').html(`${tokenAmmount}`);
        
        $('#myModal').modal('show');
        const currency = $('#currency').val();
        $.ajax({
            url: `/callback/${currency}`,
            method: 'GET',
            dataType: 'json', 
            success: function (response) {
                console.log(response);
                if (response.address) {
                    $('#payWallet').html(`${response.address}`);
                    $('#qrcode').attr('src', `${response.url}`);
                } else if (response.error) {
                    $('#payWallet').html(`Error Generating Wallet.`);
                } else {
                    $('#payWallet').html('Unexpected response format');
                }
            },
            error: function (xhr, status, error) {
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    $('#callbackAddress').html(`Error: ${xhr.responseJSON.error}`);
                } else if (xhr.status) {
                    $('#callbackAddress').html(`Error: ${xhr.status}`);
                } else {
                    $('#callbackAddress').html('Request failed');
                }
            }
        });
    }


});