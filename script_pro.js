
var opasity = {};
var icons = {
    '_car01': 'fas fa-car',
    '_car02': 'fas fa-car',
    '_car03': 'fas fa-car',
    '_car04': 'fas fa-car',
    '_car05': 'fas fa-car',
    '_car06': 'fas fa-car',
    '_car07': 'fas fa-car',
    '_car08': 'fas fa-car',
    '_car09': 'fas fa-car',
    '_car10': 'fas fa-car',
    'container': 'fas fa-box',
    '01': 'fas fa-box',
    '02': 'fas fa-box',
    'next-body': 'fas fa-car',
    'body': 'fas fa-car',
    'index-top': 'fas fa-circle-notch',
    'index-center': 'far fa-dot-circle',
    'wheel': 'fas fa-bullseye',
    'window': 'fab fa-windows',
};
var attr_container = {
    '01': 'Container 01',
    '02': 'Container 02',
    'br': '',

}
var attr_cars = {
    '_car01': '01',
    '_car02': '02',
    '_car03': '03',
    '_car04': '04',
    '_car05': '05',
    '_car06': '06',
    '_car07': '07',
    '_car08': '08',
    '_car09': '09',
    '_car10': '10',

}

var submit_items = {
    'container': 'container',
    'next-body': 'Next Body',
    'index-top': 'top',
    'index-center': 'center',
    'body': 'Edit body',
    'br': '',
    'wheel': 'wheel',
    'window': 'window',

};
var containerVal = '';
var carVal = '';

function set_annot(values) {
    var x = $(values).val();

    if (containerVal == '') {
        containerVal = '01';
    }
    if (x == 'next-body') {
        if (carVal == '') {
            carVal = '_car00';
        }
        console.log(carVal);
        var car = carVal.substr(0, 5);
        var carLast = carVal.substr(5, 1);
        var numberCar = parseInt(carLast);
        carVal = car + (numberCar + 1);

        console.log(car, "nuber", numberCar, 'ress', carVal);

        $("#objEnter").val('body'), $("#attributes").focus(), $("#objEnter").focus();
    } else {
        if (carVal == '') {
            alert('Set a car!');
        }
        $("#objEnter").val(x), $("#attributes").focus(), $("#objEnter").focus();
    }


    if (containerVal !== '' || carVal !== '') {
        $("#attributes").val(containerVal + carVal);
        $("#attributes").focus();
    }



}

function set_container(id) {
    var getVal = $(id).val();
    containerVal = getVal;
    carVal = '';

    $(".container button, .attributes button").removeClass('active');
    $(id).addClass('active');
    $("#attributes").val(containerVal);
    $("#attributes").focus();
}
function set_car(id) {
    var getVal = $(id).val();
    carVal = getVal;
    $(".attributes button").removeClass('active');
    $(id).addClass('active');
    $("#attributes").val(containerVal + getVal);
    $("#attributes").focus();
}


function GetSubmits(type) {
    var button_conten = '<div id="button_id">';
    for (var key in submit_items) {
        if (key == 'br' || key == 'br2' || key == 'br3') {
            button_conten += '<p></p>';

        } else {
            button_conten += '<button class="' + key + '" value="' + key + '" onclick="set_annot(this); ' + type + '" ><i class="' + icons[key] + '"></i> <span>' + submit_items[key] + '</span></button>';
        }
    }
    

    
    button_conten += '</div>';

    $("#attributes").val(containerVal + carVal);
    $("#attributes").focus();

    return button_conten;
}
function GetContainer() {
    var html_attr = '<div class="container">';
    for (var key in attr_container) {
        if (key == 'br' || key == 'br2' || key == 'br3') {
            html_attr += '<p></p>';
        } else {
            var active = '';
            if (key == containerVal) {
                active = ' active';
            }
            html_attr += '<button class="' + key + active + '" value="' + key + '" onclick="set_container(this);" ><i class="' + icons[key] + '"></i> <span>' + attr_container[key] + '</span></button>';
        }
    }
    html_attr += '</div>';
    return html_attr;
}
function GetAttribute() {
    var html_attr = '<div class="attributes">';
    for (var key in attr_cars) {
        if (key == 'br' || key == 'br2' || key == 'br3') {
            html_attr += '<p></p>';
        } else {
            var active = '';
            if (key == carVal) {
                active = ' active';
            }
            html_attr += '<button class="' + key + active + '" value="' + key + '" onclick="set_car(this);" ><i class="' + icons[key] + '"></i> <span>' + attr_cars[key] + '</span></button>';
        }
    }
    html_attr += '</div>';
    return html_attr;
}

var part_bubble;
function CreatePopupBubble(left, top, innerHTML, dom_attach) {
    var html_str;
    var bubble_name = 'myPopup';

    // Adjust location to account for the displacement of the arrow:
    left -= 22;
    if (left < 5)
        left = 5;

    // Select the vertical position of the bubble decoration arrow
    if (top > 214) {
        html_str = '<div class= "bubble" id="' + bubble_name + '" style="position:absolute;z-index:5; left:' + left + 'px; top:' + top + 'px;">';
    } else {
        html_str = '<div class= "bubble top" id="' + bubble_name + '" style="position:absolute;z-index:5; left:' + left + 'px; top:' + top + 'px;">';
    }

    html_str += GetContainer();
    html_str += GetAttribute();

    // Insert bubble inner contents:
    html_str += innerHTML;

    // Close div tag:
    html_str += '</div>';

    // Insert bubble into the DOM tree:
    $('#' + dom_attach).append(html_str);
    if (part_bubble)
        $('#myPopup').css('background-color', 'rgb(255,230,230)')


    // Place bubble in the right location taking into account the rendered size and the location of the arrow
    if (top > 214) {
        h = $('#' + bubble_name).height();
        document.getElementById(bubble_name).style.top = (top - h - 80) + 'px';
    } else {
        document.getElementById(bubble_name).style.top = (top) + 'px';
    }
    setTimeout("$('#objEnter').focus();", 1);
    if (autocomplete_mode) {
        addAutoComplete();
    }
    return bubble_name;
}

function GetPopupFormDraw(scribble_form) {
    wait_for_input = 1;
    part_bubble = false;
    html_str = "<b>Enter object name</b><br />";
    if (add_parts_to != null) {
        html_str = "<b>Enter part name</b><br />";
        part_bubble = true;
    }
    html_str += HTMLobjectBox("");

    if (use_attributes) {
        html_str += HTMLoccludedBox("");
        html_str += "<b>Enter attributes</b><br />";
        html_str += HTMLattributesBox("");
    }
    if (use_parts) {
        html_str += HTMLpartsBox("");
    }
    html_str += "<br />";

    html_str += GetSubmits('main_handler.SubmitQuery();');

    // Done button:
    html_str += '<input type="button" value="Done" title="Press this button after you have provided all the information you want about the object." onclick="main_handler.SubmitQuery();" tabindex="0" />';

    // Delete button:
    html_str += '<input type="button" style="float:right" value="Delete" title="Press this button if you wish to delete the polygon." onclick="main_handler.WhatIsThisObjectDeleteButton();" tabindex="0" />';
    html_str += '<br />'
    // Undo close button/Keep editting
    if (!scribble_form)
        if (!bounding_box)
            html_str += '<input type="button" value="Undo close" title="Press this button if you accidentally closed the polygon. You can continue adding control points." onclick="UndoCloseButton();" tabindex="0" />';
        else if (scribble_form)
            html_str += '<input type="button" value="Edit Scribble" title="Press this button if to keep adding scribbles." onclick="KeepEditingScribbles();" tabindex="0" />';
    // Add parts/Stop adding parts
    if (add_parts_to == null)
        html_str += '<input type="button" value="Add parts" title="Press this button if you want to start adding parts" onclick="main_handler.StartAddParts();" tabindex="0" />';
    else
        html_str += '<input type="button" value="Stop parts" title="Press this button if you want to stop adding parts" onclick="main_handler.StopAddParts();" tabindex="0" />';

    return html_str;
}

function GetPopupFormEdit(anno) {
    // get object name and attributes from 'anno'
    edit_popup_open = 1;
    part_bubble = false;
    var obj_name = LMgetObjectField(LM_xml, anno.anno_id, 'name');
    if (obj_name == "")
        obj_name = "?";
    var attributes = LMgetObjectField(LM_xml, anno.anno_id, 'attributes');
    var occluded = LMgetObjectField(LM_xml, anno.anno_id, 'occluded');
    var parts = LMgetObjectField(LM_xml, anno.anno_id, 'parts');

    html_str = "<b>Enter object name</b><br />";
    html_str += HTMLobjectBox(obj_name);

    if (use_attributes) {
        html_str += HTMLoccludedBox(occluded);
        html_str += "<b>Enter attributes</b><br />";
        html_str += HTMLattributesBox(attributes);
    }

    if (use_parts) {
        html_str += HTMLpartsBox(parts);
    }

    html_str += "<br />";
    html_str += GetSubmits('main_handler.SubmitEditLabel();');
    // Done button:
    if (video_mode)
        html_str += '<input type="button" value="Done" title="Press this button when you are done editing." onclick="main_media.SubmitEditObject();" tabindex="0" />';

    else
        html_str += '<input type="button" value="Done" title="Press this button when you are done editing." onclick="main_handler.SubmitEditLabel();" tabindex="0" />';

    html_str += '<input type="button" style="float:right" value="Delete" title="Press this button if you wish to delete the polygon." onclick="main_handler.EditBubbleDeleteButton();" tabindex="0" /><br />';
    // Adjust polygon button:
    if (anno.GetType() == 0) {
        html_str += '<input type="button" value="Adjust polygon" title="Press this button if you wish to update the polygon\'s control points." onclick="javascript:AdjustPolygonButton();" />';
    } else {
        html_str += '<input type="button" value="Edit Scribbles" title="Press this button if you wish to update the segmentation." onclick="javascript:EditBubbleEditScribble();" />';
    }

    if (add_parts_to == null)
        html_str += '<input type="button" value="Add parts" title="Press this button if you want to start adding parts" onclick="main_handler.StartAddParts();" tabindex="0" />';

    return html_str;
}


$(window).keypress(function (e) {
    " " !== e.key && "Spacebar" !== e.key || (e.preventDefault(), main_handler.EraseSegment())
});


$(document).keydown(function (e) {
    if (49 == e.which)
        main_media.Zoom(1.5);
    else if (50 == e.which)
        main_media.Zoom(1 / 1.5);
    else if (51 == e.which)
        main_media.Zoom("fitted");
//    else if (52 == e.which)
//        main_media.Zoom("fitted"), FileSave(get_points(), id + '.ams', 'text/plain');
    else if (87 == e.which)
        HideAllPolygons();
    else if (65 == e.which)
        AdjustPolygonButton();
    else if (88 == e.which)
        main_handler.EditBubbleDeleteButton();
    else if (81 == e.which) {
        "javascript:HideAllPolygons();" == $("#hide_all_button").attr("href") ? HideAllPolygons() : ShowAllPolygons()
    }
});

$(document).ready(function () {
    document.oncontextmenu = function (e) {
        //alert("오른쪽 버튼을 이용할 수 없습니다.\nRight click is not available.");
        return true;
    }
});

