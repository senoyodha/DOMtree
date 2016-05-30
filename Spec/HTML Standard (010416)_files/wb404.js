(function () {
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;

    var page_url = window.location.href;
    page_url = page_url.replace('//www-ilya.', '//');   //strip test host
    page_url = page_url.replace('//www-rkumar.', '//'); //strip test host
    var wb404_url = 'https://archive.org/wayback/available.php?callback=wb404_callback&url=' + page_url;
    s.src = wb404_url;
    var h = document.getElementsByTagName('head').item(0) || document.documentElement;
    h.appendChild(s);

    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.type = 'text/css';
    l.href = 'https://archive.org/web/wb404.css';
    h.appendChild(l);
})();

wb404_callback = function (obj) {
    var archived_text = "Would you like to <a href='$url' onClick='wb404_record_click(this); return false;'>see an archived version of this page</a> in the Internet Archive's Wayback Machine?";
    var maybe_text = "Would you like to <a href='$url' onClick='wb404_record_click(this); return false;'>check the Internet Archive's Wayback Machine</a> for an archived version of this page?";
    var wb_image = 'https://archive.org/images/wayback404.png';

    if (!obj.archived_snapshots || !obj.archived_snapshots.closest || !obj.archived_snapshots.closest.available) {
        return false;
    }

    var url = obj.archived_snapshots.closest.url;
    var html = "<br/><div class='wb404_imagediv'><a href='" + url + "' onClick='wb404_record_click(this); return false;'><img class='wb404_image' src='" + wb_image + "'/></a></div>";

    if (true) {
        html += "<div class='wb404_text'>" + archived_text.replace('$url', url) + "</div><br clear='both'/>";
    } else {
        //Not supporting this for now
        html += "<div class='wb404_text'>" + maybe_text.replace('$url', url) + "</div><br clear='both'/>";
    }

    var wb404_div = document.getElementById('wb404');
    wb404_div.innerHTML = html;
}

wb404_record_click = function (link) {
    var img = new Image(1, 1);
    img.src = 'https://analytics.archive.org/0.gif?wb404_clickthrough=1';
    setTimeout(function () {
        window.location.href = link.href
    }, 100);
}
