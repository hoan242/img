function ClonePolygon(draws_x, draws_y, annot, attr) {

    var draw_x = draws_x;
    var draw_y = draws_y;

    var nn;
    var anno;

    if (use_attributes) {
        // get attributes (is the field exists)
        if (document.getElementById('attributes'))
            new_attributes = attr;
        else
            new_attributes = attr;

        // get occlusion field (is the field exists)
        if (document.getElementById('occluded'))
            new_occluded = RemoveSpecialChars(document.getElementById('occluded').value);
        else
            new_occluded = "";
    }

    nn = annot;
    var re = /[a-zA-Z0-9]/;
    if (!re.test(nn)) {
        alert('Please enter an object name');
        return;
    }
//        anno = this.QueryToRest();
    active_canvas = REST_CANVAS;

    // Move query canvas to the back:
    document.getElementById('query_canvas').style.zIndex = -2;
    document.getElementById('query_canvas_div').style.zIndex = -2;

    // Remove polygon from the query canvas:
    if (query_anno)
        query_anno.DeletePolygon();
    anno = query_anno;
    query_anno = null;

    CloseQueryPopup();


    // Update old and new object names for logfile:
    new_name = nn;
    old_name = nn;

    submission_edited = 0;
    global_count++;

    // Insert data for server logfile:
    InsertServerLogData('cpts_not_modified');


    // Insert data into XML:
    var html_str = '<object>';
    html_str += '<name>' + new_name + '</name>';
    html_str += '<deleted>0</deleted>';
    html_str += '<verified>0</verified>';
    if (use_attributes) {
        html_str += '<occluded>' + new_occluded + '</occluded>';
        html_str += '<attributes>' + new_attributes + '</attributes>';
    }
    html_str += '<parts><hasparts></hasparts><ispartof></ispartof></parts>';
    var ts = GetTimeStamp();
    if (ts.length == 20)
        html_str += '<date>' + ts + '</date>';
    html_str += '<id>' + anno.anno_id + '</id>';
    if (bounding_box) {
        html_str += '<type>'
        html_str += 'bounding_box';
        html_str += '</type>'
    }



    html_str += '<polygon>';
    html_str += '<username>' + username + '</username>';
    for (var jj = 0; jj < draw_x.length; jj++) {
        html_str += '<pt>';
        html_str += '<x>' + draw_x[jj] + '</x>';
        html_str += '<y>' + draw_y[jj] + '</y>';
        html_str += '</pt>';
    }
    html_str += '</polygon>';
    html_str += '</object>';
    $(LM_xml).children("annotation").append($(html_str));



    if (!LMgetObjectField(LM_xml, LMnumberOfObjects(LM_xml) - 1, 'deleted') || view_Deleted) {
        main_canvas.AttachAnnotation(anno);
        anno.RenderAnnotation('rest');
    }


    /*************************************************************/
    /*************************************************************/

    if (add_parts_to != null) {
        addPart(add_parts_to, anno.anno_id);
    }

    // Write XML to server:
    WriteXML(SubmitXmlUrl, LM_xml, function () {
        return;
    });

    if (view_ObjList)
        RenderObjectList();

    var m = main_media.GetFileInfo().GetMode();
    if (m == 'mt') {
        document.getElementById('object_name').value = new_name;
        document.getElementById('number_objects').value = global_count;
        document.getElementById('LMurl').value = LMbaseurl + '?collection=LabelMe&mode=i&folder=' + main_media.GetFileInfo().GetDirName() + '&image=' + main_media.GetFileInfo().GetImName();
        if (global_count >= mt_N)
            document.getElementById('mt_submit').disabled = false;
    }
//        return anno;
}
var GetPolygon = '';
function GetPolygonPoint() {
    var polygons = $('#select_canvas a polygon').map(function () {
        return  $(this).attr('points');
    });
    GetPolygon = polygons;
    console.log(GetPolygon);
}
function StartEditEvent(anno_id, event) {

    console.log('LabelMe: Starting edit event...');

    if (add_parts_to != null) {
        $('#Link' + add_parts_to).css('font-weight', 400)
        add_parts_to = null;
    }
    if (video_mode)
        oVP.Pause();
    if (event)
        event.stopPropagation();
    if ((IsUserAnonymous() || (!IsCreator(LMgetObjectField(LM_xml, anno_id, 'username')))) && (!IsUserAdmin()) && (anno_id < num_orig_anno) && !action_RenameExistingObjects && !action_ModifyControlExistingObjects && !action_DeleteExistingObjects) {
        PermissionError();
        return;
    }
    active_canvas = SELECTED_CANVAS;
    edit_popup_open = 1;

    // Turn off automatic flag and write to XML file:
    if (LMgetObjectField(LM_xml, anno_id, 'automatic')) {
        // Insert data for server logfile:
        var anid = main_canvas.GetAnnoIndex(anno_id);
        old_name = LMgetObjectField(LM_xml, main_canvas.annotations[anid].anno_id, 'name');
        new_name = old_name;
        InsertServerLogData('cpts_not_modified');

        // Set <automatic> in XML:
        LMsetObjectField(LM_xml, anno_id, 'automatic', '0');

        // Write XML to server:
        WriteXML(SubmitXmlUrl, LM_xml, function () {
            return;
        });
    }

    // Move select_canvas to front:
    $('#select_canvas').css('z-index', '0');
    $('#select_canvas_div').css('z-index', '0');

    var anno = main_canvas.DetachAnnotation(anno_id);

    editedControlPoints = 0;

    if (username_flag)
        submit_username();

    select_anno = anno;
    select_anno.SetDivAttach('select_canvas');
    var pt_x, pt_y;
    if (video_mode) {
        pt_x = LMgetObjectField(LM_xml, select_anno.anno_id, 'x', oVP.getcurrentFrame());
        pt_y = LMgetObjectField(LM_xml, select_anno.anno_id, 'y', oVP.getcurrentFrame());
    } else {
        pt_x = select_anno.GetPtsX();
        pt_y = select_anno.GetPtsY();
    }
    FillPolygon(select_anno.DrawPolygon(main_media.GetImRatio(), pt_x, pt_y));

    // Get location where popup bubble will appear:
    var pt = main_media.SlideWindow(Math.round(pt_x[0] * main_media.GetImRatio()), Math.round(pt_y[0] * main_media.GetImRatio()));

    // Make edit popup appear.
    main_media.ScrollbarsOff();
    if (LMgetObjectField(LM_xml, anno.anno_id, 'verified')) {
        edit_popup_open = 1;
        var innerHTML = "<b>This annotation has been blocked.</b><br />";
        var dom_bubble = CreatePopupBubble(pt[0], pt[1], innerHTML, 'main_section');
        CreatePopupBubbleCloseButton(dom_bubble, StopEditEvent);
    } else {
        // Set object list choices for points and lines:
        var doReset = SetObjectChoicesPointLine(anno.GetPtsX().length);

        // Popup edit bubble:
        WriteLogMsg('*Opened_Edit_Popup');
        mkEditPopup(pt[0], pt[1], anno);

        // If annotation is point or line, then 
//        if (doReset)
//            object_choices = '...';
    }
    GetPolygonPoint();
}
function CopyPolygonSelect() {
//    var polygons = $('#select_canvas a polygon').map(function () {
//        return  $(this).attr('points');
//    });

    var polygons = GetPolygon;
    for (var i = 0; i < polygons.length; i++) {

        var draw_x = [];
        var draw_y = [];
        var polygon = polygons[i];
        var points = polygon.split(" ");
        for (var ii = 0; ii < (points.length - 1); ii++) {
            var point = points[ii];
            var pointxy = point.split(",");
//            var xs = (LEFT + 1700 - pointxy[0]) * 3.068;
            draw_x.push(pointxy[0] * 2.865);
            draw_y.push(pointxy[1] * 2.865);

        }


        StartPolygon();
        ClosePolygon();
        ClonePolygon(draw_x, draw_y, 'line', '');

    }



}
function AddPolygons() {

    var polygonsArr = $('#polygosValue').val();
    
//    if (polygonsArr == null) {
//        return;
//    }
//    return;
    
    var polygons = polygonsArr.split("_");
    console.log( polygons );

    for (var i = 0; i < (polygons.length-1); i++) {
        var draw_x = [];
        var draw_y = [];
        var polygon = polygons[i];
        var points = polygon.split(" ");
        for (var ii = 0; ii < (points.length-1); ii++) {
            var point = points[ii];
            var pointxy = point.split(",");

            draw_x.push(pointxy[0]);
            draw_y.push(pointxy[1]);

        }


        StartPolygon();
        ClosePolygon();
        ClonePolygon(draw_x, draw_y, 'line', '');

    }

}
function AddWheel() {

    var polygons = [];
    polygons.push('160.00586166471277,115.88901914810472 162.31047284095348,126.09515435717077 160.33509183274717,137.61821023837436 155.72586948026571,143.21512309495895 148.81203595154358,146.50742477530284 140.91051191871824,147.495115279406 133.6674482219617,144.20281359906213 128.72899570144588,137.94744040640876 125.76592418913638,127.41207502930833 125.76592418913638,119.83978116451739 128.72899570144588,113.25517780382962 133.3382180539273,107.9874951152794 138.93513091051193,105.68288393903869 143.21512309495895,104.69519343493552 147.8243454474404,104.69519343493552 154.07971864009377,107.9874951152794');
    polygons.push('526.1098085189527,180.08890191481046 533.0236420476749,179.1012114107073 539.2790152403282,179.7596717467761 544.8759280969128,182.39351309105118 548.8266901133255,187.00273544353263 551.789761625635,193.258108636186 551.789761625635,197.53810082063305 515.2452129738178,196.87964048456428 515.5744431418523,192.59964830011722 517.5498241500586,187.6611957796014 521.1713559984369,182.72274325908558');
    for (var i = 0; i < polygons.length; i++) {

        var draw_x = [];
        var draw_y = [];
        var polygon = polygons[i];
        var points = polygon.split(" ");
        for (var ii = 0; ii < (points.length); ii++) {
            var point = points[ii];
            var pointxy = point.split(",");
//            var xs = (LEFT + 1700 - pointxy[0]) * 3.068;
            draw_x.push(pointxy[0] * 2.865);
            draw_y.push(pointxy[1] * 2.865);

        }


        StartPolygon();
        ClosePolygon();
        ClonePolygon(draw_x, draw_y, 'line', '');

    }

}
function GetPoits(test) {
    var polygons = [];
    $('#myCanvas_bg polygon').each(function () {
        polygons.push($(this).attr("points"));
    });


    var namePolygon = [];
    $('#myCanvas_bg title').each(function () {
        namePolygon.push($(this).text());

    });

    var name = [];
    $('#anno_list ol li a').each(function () {
        name.push($(this).text());

    });
    var arrts = [];
    $('#anno_list ol li').each(function () {
        arrts.push($(this).text());
    });

//    console.log('hhh:::'+name +arrts);


    var attrsName = [];
    if (arrts !== null) {
        for (var i = 0; i < arrts.length; i++) {


            var res;
            var attr = arrts[i].split("(");

            var attr_2 = attr[1].split(")");
            var nameAttr = attr_2[0];


            if (nameAttr.search("01_") >= 0) {

                res = nameAttr.replace('01_', '02_');
            } else if (nameAttr.search("02_") >= 0) {

                res = nameAttr.replace('02_', '01_');
            } else if (nameAttr.search("02") == 0) {
                res = '01';
            } else {
                res = '02';
            }

            attrsName.push(res);

        }
    }

    var arrayAttr = [];
    for (var i = 0; i < name.length; i++) {

        if (name[i] !== 'index-center' && name[i] !== 'index-top') {
            arrayAttr.push(attrsName[i]);
        }
    }

    console.log(arrayAttr);
    for (var i = 0; i < polygons.length; i++) {

        var draw_x = [];
        var draw_y = [];
        var polygon = polygons[i];
//            var str = str.toString();
        var points = polygon.split(" ");
        for (var ii = 0; ii < (points.length - 1); ii++) {
            var point = points[ii];
            var pointxy = point.split(",");
            var xs = (LEFT + 1700 - pointxy[0]) * 3.068;
            draw_x.push(xs);
            draw_y.push(pointxy[1] * 3.068);

        }


        StartPolygon();
        ClosePolygon();
        ClonePolygon(draw_x, draw_y, namePolygon[i], arrayAttr[i]);
        if (i == test) {
            break;
        }
    }

}

function StartPolygon() {
    draw_x = new Array();
    draw_y = new Array();
    if (!action_CreatePolygon) {
//        alert('step 1');
        return;
    }
    if (active_canvas != REST_CANVAS) {
//         alert('step 2');
        return;
    }

    // Write message to the console:
    console.log('LabelMe: Starting draw event...');

    // If we are hiding all polygons, then clear the main canvas:
    if (IsHidingAllPolygons) {
//         alert('step 3');
        for (var i = 0; i < main_canvas.annotations.length; i++) {
            main_canvas.annotations[i].hidden = true;
            main_canvas.annotations[i].DeletePolygon();
        }
    }

    // Lower opacity of rest of elements
    if (video_mode)
        $('#myCanvas_bg').css('opacity', 0.5);
    // Set active canvas:
    active_canvas = DRAW_CANVAS;
    if (video_mode)
        oVP.Pause();
    // Get (x,y) mouse click location and button.
    var x = 100;
    var y = 100;
//  var x = GetEventPosX(event);
//  var y = GetEventPosY(event);
//  var button = event.button;

    // If the user does not left click, then ignore mouse-down action.
//  if(button>1) return;

    // Move draw canvas to front:
    $('#draw_canvas').css('z-index', '0');
    $('#draw_canvas_div').css('z-index', '0');

    if (username_flag)
        submit_username();

    // Create new annotation structure:
    var numItems = $(LM_xml).children('annotation').children('object').length;
    draw_anno = new annotation(numItems);

    // Add first control point:
    draw_x.push(Math.round(x / main_media.GetImRatio()));
    draw_y.push(Math.round(y / main_media.GetImRatio()));

    // Draw polyline:
    draw_anno.SetDivAttach('draw_canvas');
    draw_anno.DrawPolyLine(draw_x, draw_y);

    // Set mousedown action to handle when user clicks on the drawing canvas:
    $('#draw_canvas_div').unbind();
    $('#draw_canvas_div').mousedown({obj: this}, function (e) {
        return DrawCanvasMouseDown(e.originalEvent);
    });
    if (bounding_box) {
        alert('step 4');
        draw_anno.bounding_box = true;
        $('#draw_canvas_div').mousemove({obj: this}, function (e) {
            return DrawCanvasMouseMove(e.originalEvent);
        });

    }

    WriteLogMsg('*start_polygon');

}
function ClosePolygon() {

    active_canvas = QUERY_CANVAS;

    // Move draw canvas to the back:
    document.getElementById('draw_canvas').style.zIndex = -2;
    document.getElementById('draw_canvas_div').style.zIndex = -2;

    // Remove polygon from the draw canvas:
    var anno = null;

    if (draw_anno) {
//        alert('Step 4');
        console.log(draw_anno.first_point)
        draw_anno.DeletePolygon();
        anno = draw_anno;
        draw_anno = null;
    }
    // Move query canvas to front:
    document.getElementById('query_canvas').style.zIndex = 0;
    document.getElementById('query_canvas_div').style.zIndex = 0;

    // Set object list choices for points and lines:
//    var doReset = SetObjectChoicesPointLine(draw_x.length);

    // Get location where popup bubble will appear:
//    var pt = main_media.SlideWindow(Math.round(draw_x[0] * main_media.GetImRatio()), Math.round(draw_y[0] * main_media.GetImRatio()));

    // Make query popup appear.
    main_media.ScrollbarsOff();
    WriteLogMsg('*What_is_this_object_query');
    if (video_mode) {
//        alert('Step 5');
//        var html_str = "<b>Enter object name</b><br />";
//        html_str += HTMLobjectBox("");
//
//        if (use_attributes) {
//            html_str += HTMLoccludedBox("");
//            html_str += "<b>Enter attributes</b><br />";
//            html_str += HTMLattributesBox("");
//        }
//        if (use_parts) {
//            html_str += HTMLpartsBox("");
//        }
//        html_str += "<br />";
//
//        // Done button:
//        html_str += '<input type="button" value="Done" title="Press this button after you have provided all the information you want about the object." onclick="main_media.SubmitObject();" tabindex="0" />';
//
//        // Undo close button:
//        if (!bounding_box)
//            html_str += '<input type="button" value="Undo close" title="Press this button if you accidentally closed the polygon. You can continue adding control points." onclick="UndoCloseButton();" tabindex="0" />';
//
//        // Delete button:
//        html_str += '<input type="button" value="Delete" title="Press this button if you wish to delete the polygon." onclick="main_handler.WhatIsThisObjectDeleteButton();" tabindex="0" />';
//
//
//
//        wait_for_input = 1;
//        CreatePopupBubble(pt[0], pt[1], html_str, 'main_section');
    } else {
//        alert('Step 6');
//        mkPopup(pt[0], pt[1]);
    }

    // If annotation is point or line, then 
//    if (doReset) {
//        alert('Step 7');
//        object_choices = '...';
//    }

    // Render annotation:
    query_anno = anno;
    query_anno.SetDivAttach('query_canvas');
    FillPolygon(query_anno.DrawPolygon(main_media.GetImRatio(), draw_x, draw_y));
}

function CloseQueryPopup() {
    wait_for_input = 0;
    $('#myPopup').remove();
}
function handler() {

    this.ClonePolygon = function (draws_x, draws_y, annot, attr) {

        var draw_x = draws_x;
        var draw_y = draws_y;

        var nn;
        var anno;

        new_attributes = attr;

        nn = annot;
        var re = /[a-zA-Z0-9]/;
        if (!re.test(nn)) {
            alert('Please enter an object name');
            return;
        }
        anno = this.QueryToRest();

        // Update old and new object names for logfile:
        new_name = nn;
        old_name = nn;

        submission_edited = 0;
        global_count++;

        // Insert data for server logfile:
        InsertServerLogData('cpts_not_modified');

        // Insert data into XML:
        var html_str = '<object>';
        html_str += '<name>' + new_name + '</name>';
        html_str += '<deleted>0</deleted>';
        html_str += '<verified>0</verified>';
        if (use_attributes) {
            html_str += '<occluded>' + new_occluded + '</occluded>';
            html_str += '<attributes>' + new_attributes + '</attributes>';
        }
        html_str += '<parts><hasparts></hasparts><ispartof></ispartof></parts>';
        var ts = GetTimeStamp();
        if (ts.length == 20)
            html_str += '<date>' + ts + '</date>';
        html_str += '<id>' + anno.anno_id + '</id>';
        if (bounding_box) {
            html_str += '<type>'
            html_str += 'bounding_box';
            html_str += '</type>'
        }

        html_str += '<polygon>';
        html_str += '<username>' + username + '</username>';
        for (var jj = 0; jj < draw_x.length; jj++) {
            html_str += '<pt>';
            html_str += '<x>' + draw_x[jj] + '</x>';
            html_str += '<y>' + draw_y[jj] + '</y>';
            html_str += '</pt>';
        }
        html_str += '</polygon>';
        html_str += '</object>';
        $(LM_xml).children("annotation").append($(html_str));



        if (!LMgetObjectField(LM_xml, LMnumberOfObjects(LM_xml) - 1, 'deleted') || view_Deleted) {
            main_canvas.AttachAnnotation(anno);
            anno.RenderAnnotation('rest');
        }


        /*************************************************************/
        /*************************************************************/

        if (add_parts_to != null) {
            addPart(add_parts_to, anno.anno_id);
        }

        // Write XML to server:
        WriteXML(SubmitXmlUrl, LM_xml, function () {
            return;
        });

        if (view_ObjList)
            RenderObjectList();

        var m = main_media.GetFileInfo().GetMode();
        if (m == 'mt') {
            document.getElementById('object_name').value = new_name;
            document.getElementById('number_objects').value = global_count;
            document.getElementById('LMurl').value = LMbaseurl + '?collection=LabelMe&mode=i&folder=' + main_media.GetFileInfo().GetDirName() + '&image=' + main_media.GetFileInfo().GetImName();
            if (global_count >= mt_N)
                document.getElementById('mt_submit').disabled = false;
        }
        return anno;
    };

    // *******************************************
    // Public methods:
    // *******************************************


    this.StartAddParts = function () {

        if (select_anno) {
            var anno_id = select_anno.anno_id;
            this.SubmitEditLabel();
            add_parts_to = anno_id;
        } else {
            var anno = this.SubmitQuery();
            add_parts_to = anno.anno_id;
        }
        $('#Link' + add_parts_to).css('font-weight', 700);
        console.log(anno);
    }

    this.StopAddParts = function () {
        if (select_anno)
            this.SubmitEditLabel();
        else
            this.SubmitQuery();
        $('#Link' + add_parts_to).css('font-weight', 400);
        add_parts_to = null;
    }

    // Handles when the user presses the delete button in response to
    // the "What is this object?" popup bubble.
    this.WhatIsThisObjectDeleteButton = function () {
        submission_edited = 0;
        this.QueryToRest();
        if (scribble_canvas.scribblecanvas)
            scribble_canvas.cleanscribbles();
    };

    // Submits the object label in response to the edit/delete popup bubble.
    this.SubmitEditLabel = function () {
//        GetPolygonPoint();
        if (scribble_canvas.scribblecanvas) {
            scribble_canvas.annotationid = -1;
            scribble_canvas.cleanscribbles();
        }
        submission_edited = 1;
        var anno = select_anno;

        // object name
        old_name = LMgetObjectField(LM_xml, anno.anno_id, 'name');
        if (document.getElementById('objEnter'))
            new_name = RemoveSpecialChars(document.getElementById('objEnter').value);
        else
            new_name = RemoveSpecialChars(adjust_objEnter);

        var re = /[a-zA-Z0-9]/;
        if (!re.test(new_name)) {
            alert('Please enter an object name');
            return;
        }

        if (use_attributes) {
            // occlusion field
            if (document.getElementById('occluded'))
                new_occluded = RemoveSpecialChars(document.getElementById('occluded').value);
            else
                new_occluded = RemoveSpecialChars(adjust_occluded);

            // attributes field
            if (document.getElementById('attributes'))
                new_attributes = RemoveSpecialChars(document.getElementById('attributes').value);
            else
                new_attributes = RemoveSpecialChars(adjust_attributes);
        }

        StopEditEvent();

        // Insert data to write to logfile:
        if (editedControlPoints)
            InsertServerLogData('cpts_modified');
        else
            InsertServerLogData('cpts_not_modified');

        // Object index:
        var obj_ndx = anno.anno_id;

        // Pointer to object:

        // Set fields:
        LMsetObjectField(LM_xml, obj_ndx, "name", new_name);
        LMsetObjectField(LM_xml, obj_ndx, "automatic", "0");

        // Insert attributes (and create field if it is not there):
        LMsetObjectField(LM_xml, obj_ndx, "attributes", new_attributes);


        LMsetObjectField(LM_xml, obj_ndx, "occluded", new_occluded);

        // Write XML to server:
        WriteXML(SubmitXmlUrl, LM_xml, function () {
            return;
        });

        // Refresh object list:
        if (view_ObjList) {
            RenderObjectList();
            ChangeLinkColorFG(anno.GetAnnoID());
        }
    };

    // Handles when the user presses the delete button in response to
    // the edit popup bubble.
    this.EditBubbleDeleteButton = function () {
        var idx = select_anno.GetAnnoID();

        if ((IsUserAnonymous() || (!IsCreator(LMgetObjectField(LM_xml, idx, 'username')))) && (!IsUserAdmin()) && (idx < num_orig_anno) && !action_DeleteExistingObjects) {
            alert('You do not have permission to delete this polygon');
            return;
        }

        if (idx >= num_orig_anno) {
            global_count--;
        }

        submission_edited = 0;

        // Insert data for server logfile:
        old_name = LMgetObjectField(LM_xml, select_anno.anno_id, 'name');
        new_name = old_name;
        WriteLogMsg('*Deleting_object');
        InsertServerLogData('cpts_not_modified');

        // Set <deleted> in LM_xml:
        LMsetObjectField(LM_xml, idx, "deleted", "1");

        // Remove all the part dependencies for the deleted object
        removeAllParts(idx);

        // Write XML to server:
        WriteXML(SubmitXmlUrl, LM_xml, function () {
            return;
        });

        // Refresh object list:
        if (view_ObjList)
            RenderObjectList();
        selected_poly = -1;
        unselectObjects(); // Perhaps this should go elsewhere...
        StopEditEvent();
        if (scribble_canvas.scribblecanvas) {
            scribble_canvas.annotationid = -1;
            scribble_canvas.cleanscribbles();
        }
    };

    // Handles when the user clicks on the link for an annotation.
    this.AnnotationLinkClick = function (idx) {
        if (adjust_event)
            return;
        if (video_mode && LMgetObjectField(LM_xml, idx, 'x', oVP.getcurrentFrame()).length == 0) {
            // get frame that is closest

            var frames = LMgetObjectField(LM_xml, idx, 't');
            var id1 = -1;
            var id2 = frames.length;
            var i = 0;
            while (i < frames.length) {
                if (frames[i] >= oVP.getcurrentFrame())
                    id2 = Math.min(id2, i);
                else
                    id1 = Math.max(id1, i);
                i++;
            }
            if (id2 < frames.length)
                oVP.GoToFrame(frames[id2]);
            else
                oVP.GoToFrame(frames[id1]);
        }
        if (active_canvas == REST_CANVAS)
            StartEditEvent(idx, null);
        else if (active_canvas == SELECTED_CANVAS) {
            var anno_id = select_anno.GetAnnoID();
            if (edit_popup_open) {
                StopEditEvent();
                ChangeLinkColorBG(idx);
            }
            if (idx != anno_id) {
                if (video_mode)
                    oVP.HighLightFrames(LMgetObjectField(LM_xml, idx, 't'), LMgetObjectField(LM_xml, idx, 'userlabeled'));
                ChangeLinkColorFG(idx);
                StartEditEvent(idx, null);
            }
        }
    };

    // Handles when the user moves the mouse over an annotation link.
    this.AnnotationLinkMouseOver = function (a) {
        if (active_canvas != SELECTED_CANVAS && video_mode && LMgetObjectField(LM_xml, a, 'x', oVP.getcurrentFrame()).length == 0) {
            ChangeLinkColorFG(a);
            oVP.HighLightFrames(LMgetObjectField(LM_xml, a, 't'), LMgetObjectField(LM_xml, a, 'userlabeled'));
            selected_poly = a;
        } else if (active_canvas != SELECTED_CANVAS) {
            selectObject(a);
            console.log('select');
        }

    };

    // Handles when the user moves the mouse away from an annotation link.
    this.AnnotationLinkMouseOut = function () {

        if (active_canvas != SELECTED_CANVAS) {
            unselectObjects();
        }
    };

    // Handles when the user moves the mouse over a polygon on the drawing
    // canvas.
    this.CanvasMouseMove = function (event, pp) {
        var x = GetEventPosX(event);
        var y = GetEventPosY(event);
        if (IsNearPolygon(x, y, pp))
            selectObject(pp);
        else
            unselectObjects();
    };

    // Submits the object label in response to the "What is this object?"
    // popup bubble. THIS FUNCTION IS A MESS!!!!
    this.SubmitQuery = function () {
        var nn;
        var anno;

        // If the attributes are active, read the fields.
        if (use_attributes) {
            // get attributes (is the field exists)
            if (document.getElementById('attributes'))
                new_attributes = RemoveSpecialChars(document.getElementById('attributes').value);
            else
                new_attributes = "";

            // get occlusion field (is the field exists)
            if (document.getElementById('occluded'))
                new_occluded = RemoveSpecialChars(document.getElementById('occluded').value);
            else
                new_occluded = "";
        }

        if ((object_choices != '...') && (object_choices.length == 1)) {
            nn = RemoveSpecialChars(object_choices[0]);
            var re = /[a-zA-Z0-9]/;
            if (!re.test(nn)) {
                alert('Please enter an object name');
                return;
            }
            active_canvas = REST_CANVAS;

            // Move draw canvas to the back:
            document.getElementById('draw_canvas').style.zIndex = -2;
            document.getElementById('draw_canvas_div').style.zIndex = -2;

            // Remove polygon from the draw canvas:
            var anno = null;
            if (draw_anno) {
                draw_anno.DeletePolygon();
                anno = draw_anno;
                draw_anno = null;
            }
        } else {
            nn = RemoveSpecialChars(document.getElementById('objEnter').value);
            var re = /[a-zA-Z0-9]/;
            if (!re.test(nn)) {
                alert('Please enter an object name');
                return;
            }
            anno = this.QueryToRest();
        }


        // Update old and new object names for logfile:
        new_name = nn;
        old_name = nn;

        submission_edited = 0;
        global_count++;

        // Insert data for server logfile:
        InsertServerLogData('cpts_not_modified');

        // Insert data into XML:
        var html_str = '<object>';
        html_str += '<name>' + new_name + '</name>';
        html_str += '<deleted>0</deleted>';
        html_str += '<verified>0</verified>';
        if (use_attributes) {
            html_str += '<occluded>' + new_occluded + '</occluded>';
            html_str += '<attributes>' + new_attributes + '</attributes>';
        }
        html_str += '<parts><hasparts></hasparts><ispartof></ispartof></parts>';
        var ts = GetTimeStamp();
        if (ts.length == 20)
            html_str += '<date>' + ts + '</date>';
        html_str += '<id>' + anno.anno_id + '</id>';
        if (bounding_box) {
            html_str += '<type>'
            html_str += 'bounding_box';
            html_str += '</type>'
        }
        if (anno.GetType() == 1) {


            /*************************************************************/
            /*************************************************************/
            // Scribble: Add annotation to LM_xml:
            html_str += '<segm>';
            html_str += '<username>' + username + '</username>';

            html_str += '<box>';
            html_str += '<xmin>' + scribble_canvas.object_corners[0] + '</xmin>';
            html_str += '<ymin>' + scribble_canvas.object_corners[1] + '</ymin>';
            html_str += '<xmax>' + scribble_canvas.object_corners[2] + '</xmax>';
            html_str += '<ymax>' + scribble_canvas.object_corners[3] + '</ymax>';
            html_str += '</box>';

            html_str += '<mask>' + scribble_canvas.image_name + '</mask>';

            html_str += '<scribbles>';
            html_str += '<xmin>' + scribble_canvas.image_corners[0] + '</xmin>';
            html_str += '<ymin>' + scribble_canvas.image_corners[1] + '</ymin>';
            html_str += '<xmax>' + scribble_canvas.image_corners[2] + '</xmax>';
            html_str += '<ymax>' + scribble_canvas.image_corners[3] + '</ymax>';
            html_str += '<scribble_name>' + scribble_canvas.scribble_name + '</scribble_name>';
            html_str += '</scribbles>';

            html_str += '</segm>';
            html_str += '</object>';
            $(LM_xml).children("annotation").append($(html_str));
            /*************************************************************/
            /*************************************************************/
        } else {
            html_str += '<polygon>';
            html_str += '<username>' + username + '</username>';
            for (var jj = 0; jj < draw_x.length; jj++) {
                html_str += '<pt>';
                html_str += '<x>' + draw_x[jj] + '</x>';
                html_str += '<y>' + draw_y[jj] + '</y>';
                html_str += '</pt>';
            }
            html_str += '</polygon>';
            html_str += '</object>';
            $(LM_xml).children("annotation").append($(html_str));
        }


        if (!LMgetObjectField(LM_xml, LMnumberOfObjects(LM_xml) - 1, 'deleted') || view_Deleted) {
            main_canvas.AttachAnnotation(anno);
            anno.RenderAnnotation('rest');
        }

        /*************************************************************/
        /*************************************************************/
        // Scribble: Clean scribbles.
        if (anno.GetType() == 1) {
            scribble_canvas.cleanscribbles();
            scribble_canvas.scribble_image = "";
            scribble_canvas.colorseg = Math.floor(Math.random() * 14);
        }
        /*************************************************************/
        /*************************************************************/

        if (add_parts_to != null)
            addPart(add_parts_to, anno.anno_id);
        // Write XML to server:
        WriteXML(SubmitXmlUrl, LM_xml, function () {
            return;
        });

        if (view_ObjList)
            RenderObjectList();

        var m = main_media.GetFileInfo().GetMode();
        if (m == 'mt') {
            document.getElementById('object_name').value = new_name;
            document.getElementById('number_objects').value = global_count;
            document.getElementById('LMurl').value = LMbaseurl + '?collection=LabelMe&mode=i&folder=' + main_media.GetFileInfo().GetDirName() + '&image=' + main_media.GetFileInfo().GetImName();
            if (global_count >= mt_N)
                document.getElementById('mt_submit').disabled = false;
        }
        return anno;
    };


    // Handles when we wish to change from "query" to "rest".
    this.QueryToRest = function () {
        active_canvas = REST_CANVAS;

        // Move query canvas to the back:
        document.getElementById('query_canvas').style.zIndex = -2;
        document.getElementById('query_canvas_div').style.zIndex = -2;

        // Remove polygon from the query canvas:
        if (query_anno)
            query_anno.DeletePolygon();
        var anno = query_anno;
        query_anno = null;

        CloseQueryPopup();
        main_media.ScrollbarsOn();

        return anno;
    };

    // Handles when the user presses a key while interacting with the tool.
    this.KeyPress = function (event) {
        // Delete event: 46 - delete key; 8 - backspace key
        if (((event.keyCode == 46) || (event.keyCode == 8)) && !wait_for_input && !edit_popup_open && !username_flag) {
            // Determine whether we are deleting a complete or partially
            // complete polygon.
            if (!main_handler.EraseSegment())
                DeleteSelectedPolygon();
        }
        // 27 - Esc key
        // Close edit popup if it is open.
        if (event.keyCode == 27 && edit_popup_open)
            StopEditEvent();
    };

    // Handles when the user erases a segment.
    this.EraseSegment = function () {
        if (draw_anno && !draw_anno.DeleteLastControlPoint()) {
            submission_edited = 0;
            StopDrawEvent();
        }
        return draw_anno;
    };

    // *******************************************
    // Private methods:
    // *******************************************




}
function RenderObjectList() {
    // If object list has been rendered, then remove it:
    var scrollPos = $("#anno_list").scrollTop();
    if ($('#anno_list').length) {
        $('#anno_list').remove();
    }

    var html_str = '<div class="object_list" id="anno_list" style="border:0px solid black;z-index:0;" ondrop="drop(event, -1)" ondragenter="return dragEnter(event)" ondragover="return dragOver(event)">';

    var Npolygons = LMnumberOfObjects(LM_xml);
    var NundeletedPolygons = 0;

    // Count undeleted objects:
    for (var ii = 0; ii < Npolygons; ii++) {
        if (!parseInt(LMgetObjectField(LM_xml, ii, 'deleted'))) {
            NundeletedPolygons++;
        }
    }

    // Get parts tree
    var tree = getPartsTree();

    // Create DIV
    if (showImgName) {
        html_str += '<p><b>Image name: ' + imgName + '</b></p>';
    }
    //html_str += '<b>Polygons in this image ('+ NundeletedPolygons +')</b>';
    //html_str += '<button  onclick="StartPolygon();ClosePolygon(); main_handler.ClonePolygon();" > <span>Clone Polygon</span></button>';
//    html_str += '<button class="polygon test" type="button" onclick="GetPoits(1);" > <span>Clone Test</span></button>';
//    html_str += '<button class="polygon" type="button"  onclick="GetPoits();" > <span>Clone Polygon</span></button>';
//    html_str += '<button  onclick="AddWheel();" >Add Wheel</button>';
    html_str += '<input id="polygosValue" type="text" />';
    html_str += '<button  onclick="AddPolygons();" >Add Polygons</button>';
    html_str += '<button  onclick="CopyPolygonSelect();" >Copy Select</button>';
    html_str += '<button id="zoomin" class="labelBtnDraw" type="button" title="Zoom In" onclick="javascript:main_media.Zoom(1.15)"><img src="Icons/zoomin.png" width="28" height="38" /></button>';
    html_str += '<button id="zoomout" class="labelBtnDraw" type="button" title="Zoom Out" onclick="javascript:main_media.Zoom(1.0/1.15)"><img src="Icons/zoomout.png" width="28" height="38" /></button>';
    html_str += '<button xmlns="http://www.w3.org/1999/xhtml" id="erase" class="labelBtnDraw" type="button" title="Delete last segment" onclick="main_handler.EraseSegment()">';
    html_str += '<img src="Icons/erase.png" width="28" height="38" />         </button>';

    //html_str += '<p style="font-size:10px;line-height:100%"><a ' + 'onmouseover="main_canvas.ShadePolygons();" ' + 'onmouseout="main_canvas.RenderAnnotations();"> Reveal unlabeled pixels </a></p>';
    // Create "hide all" button:
    if (IsHidingAllPolygons) {
        html_str += '<p style="font-size:10px;line-height:100%"><a id="show_all_button" href="javascript:ShowAllPolygons();">Show all polygons</a></p>';
    } else {
        IsHidingAllPolygons = false;
        html_str += '<p style="font-size:10px;line-height:100%"><a id="hide_all_button" href="javascript:HideAllPolygons();">Hide all polygons</a></p>';
    }

    // Add parts-of drag-and-drop functionality:
    if (use_parts) {
        //html_str += '<p style="font-size:10px;line-height:100%" ondrop="drop(event, -1)" ondragenter="return dragEnter(event)" ondragover="return dragOver(event)">Drag a tag on top of another one to create a part-of relationship.</p>';
    }
    html_str += '<ol>';

    // Show list (of non-deleted objects)
    for (var i = 0; i < Npolygons; i++) {
        // get part level and read objects in the order given by the parts tree
        if (use_parts) {
            var ii = tree[0][i];
            var level = tree[1][i];
        } else {
            var ii = i;
            var level = 0;
        }

        var isDeleted = parseInt(LMgetObjectField(LM_xml, ii, 'deleted'));
        var is_currently_shown = true;

        if (is_currently_shown && (((ii < num_orig_anno) && ((view_Existing && !isDeleted) || (isDeleted && view_Deleted))) || ((ii >= num_orig_anno) && (!isDeleted || (isDeleted && view_Deleted))))) {
            // change the left margin as a function of part level

            html_str += '<div class="objectListLink" id="LinkAnchor' + ii + '" style="z-index:1; margin-left:' + (level * 1.5) + 'em" ';

            if (use_parts) {
                // define drag events (but only if the tool is allowed to use parts)
                html_str += 'draggable="true" ondragstart="drag(event, ' + ii + ')" ' +
                        'ondragend="dragend(event, ' + ii + ')" ' +
                        'ondrop="drop(event, ' + ii + ')" ' +
                        'ondragenter="return dragEnter(event)" ' +
                        'ondragover="return dragOver(event)">';
            }

            // change the icon for parts
            if (level == 0) {
                // if it is not a part, show square
                html_str += '<li>';
            } else {
                // if it is a part, use part style
                html_str += '<li class="children_tree">';
            }

            // show object name:
            html_str += '<a class="objectListLink"  id="Link' + ii + '" ' +
                    'href="javascript:main_handler.AnnotationLinkClick(' + ii + ');" ' +
                    'onmouseover="main_handler.AnnotationLinkMouseOver(' + ii + ');" ' +
                    'onmouseout="main_handler.AnnotationLinkMouseOut();" ';

            if (use_parts) {
                html_str += 'ondrop="drop(event, ' + ii + ')" ' +
                        'ondragend="dragend(event, ' + ii + ')" ' +
                        'ondragenter="return dragEnter(event)" ' +
                        'ondragover="return dragOver(event)"';
            }

            if (isDeleted) {
                html_str += ' style="color:#888888"><b>';
            } else {
                html_str += '>';
            }

            var obj_name = LMgetObjectField(LM_xml, ii, 'name');
            if (obj_name.length == 0 && !draw_anno) {
                html_str += '<i>[ Please enter name ]</i>';
            } else {
                html_str += obj_name;
            }

            if (isDeleted)
                html_str += '</b>';
            html_str += '</a>';

            var attributes = LMgetObjectField(LM_xml, ii, 'attributes');
            if (attributes.length > 0) {
                html_str += ' (' + attributes + ')';
            }

            html_str += '</li></div>';
        }
    }

    html_str += '</ol><p><br/></p></div>';

    // Attach annotation list to 'anno_anchor' DIV element:
    $('#anno_anchor').append(html_str);
    $('#Link' + add_parts_to).css('font-weight', 700); //
    $('#anno_list').scrollTop(scrollPos);
}
