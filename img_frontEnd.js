$( document ).ready(function() {
  if(!$("#person").val()){
    $("#person").attr("value",1);
  }
  var str = $("#f_path").val()
  if(str){
    var res = str.split("/");
    var ids = {
      "type":"#type3",
      "location":"#location2",
      "express":"#express1",
      "happy":"#happy0",
      "sad":"#sad0",
      "anger":"#anger0",
      "suprise":"#suprise0",
      "race":"#race1",
      "celeb":"#celeb1",
      "beard":"#beard0",
    };
    // switch (res[2]) { case 'TYPE_C':ids["type"]="#type3";break;case 'TYPE_B': ids["type"]="#type1"; break;default:ids["type"]="#type1";}
    for(key in ids){
      if(!$('input[name="'+key+'"]:checked').val()){
        $(ids[key]).prop("checked", true);
      }
    }
  }
  var list = {
    'express1':'express0',
    'happy1':'happy0',
    'sad1':'sad0',
    'anger1':'anger0',
    'suprise1':'suprise0',
  }
  for(key in list){
    $('label[for="'+key+'"]').click(function(){
      for(key in list){
        $('input#'+list[key]).prop("checked", true);
      }
    });
  }
var content = '<button id="get_img" style="position:fixed" >Get Images</button> ';
  content += '<div id="checkbox" >';
  // var title = {};
  for(var i=0;i<10;i++){
    content += '<input type="checkbox" value="'+i+'" style="display:block" >';
    // content += '<button id="img_'+i+'" style="display:block" >blank</button>';
  }
  content += '</div>';
  $('body > #mainform').prepend(content);
  
  function get_img(){
     var searchIDs = $('#checkbox input:checked').map(function(){
      return $(this).val();
    }).get();
    // alert(searchIDs);
    var srcs = $('#div-tab table tbody tr img');
    if(searchIDs.length==0){
      
      srcs.each(function() {  
        imgsrc = this.src;
        imgsrc = imgsrc.replace("/LabelMe", ":8000/labelme");
        window.win = open (imgsrc);
        setTimeout('win.document.execCommand("save")', 500);
      });
    }else{
      
      for(var i=0; i<searchIDs.length; i++){
        var a=0;
        srcs.each(function() {
          if(searchIDs[i]==a){
            imgsrc = this.src;
            imgsrc = imgsrc.replace("/LabelMe", ":8000/labelme");
            window.win = open (imgsrc);
            setTimeout('win.document.execCommand("save")', 500);
          }
          a++;
        });
      }
     
      
    }
  }
  $('#get_img').click(function(){
     get_img();
  });
  
});

function setCookie(cname,cvalue,exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkCookie() {
    var user=getCookie("username");
    if (user != "") {
        alert("Welcome again " + user);
    } else {
       user = prompt("Please enter your name:","");
       if (user != "" && user != null) {
           setCookie("username", user, 30);
       }
    }
}
var no = getCookie('page');
    // 	alert(no);
go_page(no);
function go_page(no) {
	setCookie('page',no,1);
	$('.no-bg').removeClass('on');
	$('#page_'+no).addClass('on');
		
	$.ajax({
		data:{"user_id" : $('#user_id').val(), "prt" : $('#prt').val(), "page":no},
		method:"POST",
		url:"img_list_ajax.ajax",
	    cache: true,
	}).done(function(result){
		$('#page').val(no);
		$("div#div-tab").html(result);
	});
}

function go_edit (id, path) {
	$('#id').val(id);
	$('#path').val(path);
	document.mainform.action = "go_edit.do";
	document.mainform.target = "_blank";
	document.mainform.submit();    		
}
