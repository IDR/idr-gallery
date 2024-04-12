$(document).ready(function () {
    $.get('/about/VERSION', null, function(data, textStatus) {
        $('#version-number-display').text(data);
    }, 'text');
});
