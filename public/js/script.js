// CHANGE NAVBAR COLOR ON PAGE SCROLL 
$(document).ready(function() {
    var navbar = $('.navbar');
    var navbarHeight = navbar.outerHeight();

    $(window).scroll(function() {
        if ($(this).scrollTop() > navbarHeight) {
            navbar.css('background-color', 'rgba(255, 255, 255, 1)');
        } else {
            navbar.css('background-color', 'transparent');
        }
    });
});