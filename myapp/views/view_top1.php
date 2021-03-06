<?php
   function add_stat(string $file) {
       $split_file = explode('?', $file);
       $file_stat = stat($split_file[0]); // We need this to modify the href attribute on $file. Otherwise
                                          // Internet Explorer may not reload the file, even if it has changed.

       if (isset($split_file[1])) // $file had query string
           $query = $split_file[1] . "&amp;stat=$file_stat[9]";
       else
           $query = "stat=$file_stat[9]";

       return "$split_file[0]?$query";
   }


   function make_css(string $file) {
       echo "<link type=\"text/css\" href=\"", site_url(add_stat($file)), "\" rel=\"stylesheet\" />\n";
   }

   function make_js(string $file) {
       echo "<script type=\"text/javascript\" src=\"", site_url(add_stat($file)), "\"></script>\n";
    }
?>
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title><?= $title ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <?php
       make_css('bootstrap/bibleol/css/bootstrap.css');
       make_css('jquery-ui-1.10.2.custom/css/sunny/jquery-ui-1.10.2.custom.min.css');
       make_css('styles/ol.css');
       make_css('styles/fonts.css');

       if (!isset($css_list))
           $css_list=array();

       foreach ($css_list as $css)
           make_css($css);

       make_js('js/jquery-1.9.1.min.js');
       make_js('bootstrap/dist/js/bootstrap.min.js');
       make_js('jquery-ui-1.10.2.custom/js/jquery-ui-1.10.2.custom.min.js');
       make_js('js/simpledropdown.js');
    
       if (!isset($js_list))
           $js_list=array();

       foreach ($js_list as $js)
       make_js($js);
