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
$(document).ready(function () {
    $('#copyButton').on('click', function () {
        var textToCopy = $('#payWallet').text();

        navigator.clipboard.writeText(textToCopy).then(function () {
            $('#copyButton').text('Copied!');
            setTimeout(function () {
                $('#copyButton').html('Copy <i class="bi bi-clipboard2-check"></i>');
            }, 2000);
        }).catch(function (err) {
            console.error('Failed to copy text: ', err);
        });
    });
});

function isValidCosmosAddress(inputElement) {
    // Get the value from the input element
    const address = inputElement.trim();

    // Regular expression pattern for Boua addresses
    const cosmosAddressPattern = /^boua1[a-zA-Z0-9]{38}$/;

    // Check if the address matches the pattern
    return cosmosAddressPattern.test(address);
}
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
    let bouaWallet = $("#bouaWallet").val();
    if (isValidCosmosAddress(bouaWallet)) {
        $("#validAddress").removeClass("red");

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
    } else {
        $("#validAddress").addClass("red");
    }

});



$('#ConfirmButton').on('click', function () {
    let totalRecieve = $("#totalBoua").val();
    let bouaWallet = $("#bouaWallet").val();
    let walletAddress= $("#payWallet").html();
    let paymentCurrency = $('#currency').val();
    let tokenAmmount = $('#payAmmount').html();

   $('#myModal').modal('hide');
   $('#myModalTwo').modal('show');
   let countdownDuration = 60; // Countdown duration in seconds
    let countdownInterval;
    
    function updateCountdown() {
        $('#countdown').text(`Time remaining: ${countdownDuration} seconds`);
        if (countdownDuration <= 0) {
            clearInterval(countdownInterval);
        }
        countdownDuration--;
    }
    
    // Start countdown timer
    countdownInterval = setInterval(updateCountdown, 1000);
    $.ajax({
        url: `/confirm/${walletAddress}/${paymentCurrency}/${tokenAmmount}`,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            console.log(response.success);
            if(response.sucess === true){
                clearInterval(countdownInterval); 
                $('#spinner').hide(); // Hide spinner
                $('#countdown').hide(); // Hide countdown
                $('#status-text').text('Verified');
                $('#status-text').append('<i class="bi bi-patch-check-fill ps-2" style="color: green;"></i>'); // Add checkmark icon
            }
            else if(response.success === false){
                clearInterval(countdownInterval); 
            $('#spinner').hide(); // Hide spinner
            $('#countdown').hide(); // Hide countdown
            $('#status-text').text('Failed to Verify');
            $('#status-text').append('<i class="bi bi-patch-check-fill ps-2" style="color: red;"></i>'); // Add checkmark icon
            }
            // if (response.address) {
            //     $('#payWallet').html(`${response.address}`);
            //     $('#qrcode').attr('src', `${response.url}`);
            // } else if (response.error) {
            //     $('#payWallet').html(`Error Generating Wallet.`);
            // } else {
            //     $('#payWallet').html('Unexpected response format');
            // }
            
        },
        // error: function (xhr, status, error) {
        //     // if (xhr.responseJSON && xhr.responseJSON.error) {
        //     //     $('#callbackAddress').html(`Error: ${xhr.responseJSON.error}`);
        //     // } else if (xhr.status) {
        //     //     $('#callbackAddress').html(`Error: ${xhr.status}`);
        //     // } else {
        //     //     $('#callbackAddress').html('Request failed');
        //     // }
        // }
    });
});


$(document).ready(function() {
    // $.get('/confirm', function(response) {
    //     if (response === true) {
    //         clearInterval(countdownInterval); // Stop countdown
    //         $('#spinner').hide(); // Hide spinner
    //         $('#countdown').hide(); // Hide countdown
    //         $('#status-text').text('Verified');
    //         $('#status-text').append('<i class="icon-checkmark"></i>'); // Add checkmark icon
    //     }
    // });
});