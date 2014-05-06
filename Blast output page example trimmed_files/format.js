
function UpdateDisplayTypes(displayTypes) {	
    dispMenu = displayTypes.options;		
    for(i=0; i < dispMenu.length; i++) {
	    //if(!utils.hasClass(displayTypes,"psiBlast") && !utils.hasClass(displayTypes,"phiBlast") ||
	    if($("stepNumber").value == "" || $("stepNumber").value < 2) {	    	    
			if(dispMenu[i].value.indexOf("PSSM") != -1) {
				dispMenu[i--] = null;
				//break;
			}			
		}		
	}	    
}

function GetIndexByValue(selectElem,val) {	
    var idx = 0;
    var opts = selectElem.options;		
    for(i=0; i < opts.length; i++) {
        if(opts[i].value == val) {
            idx = i;
            break;
        }
    }	
    return idx;	    
}

function resetAdvView(show)
{
    var advView = $("advView");    
    if(show) {
        if(utils.hasClass(advView, "hidden")) {
            utils.removeClass(advView, "hidden");
        }    
    }
    else {
        utils.addClass(advView, "hidden");
    }
}


function ShowOrHide(hide,elem)
{
    if(hide) {
        if(!utils.hasClass(elem, "hidden")) {
            utils.addClass(elem, "hidden");
        }    
    }
    else {
        if(utils.hasClass(elem, "hidden")) {
            utils.removeClass(elem, "hidden");
        }    
    }
}    

function UpdateFormatTypes(form) {    
    var selectedObjType = form.FORMAT_OBJECT[form.FORMAT_OBJECT.selectedIndex].value;
    var hideAdvView = false;
    bioseqFormatHide = true;
    pssmFormatHide = true;
    pssmScFormatHide = true;
    formatTypeHide = true;
	if (selectedObjType == "Alignment") {
		formatObjectSelectedIndex = 0; //HTML		
		formatTypeHide = false;		
		hideAdvView = true;
	}
    if (selectedObjType == "PSSM") {		
		formatObjectSelectedIndex = GetIndexByValue(form.FORMAT_TYPE,"Text");	
		pssmFormatHide = false;		
    }
    if (selectedObjType == "PSSM_Scoremat") {		
		formatObjectSelectedIndex = GetIndexByValue(form.FORMAT_TYPE,"ASN.1");		
		pssmScFormatHide = false;		
    }    
    else if (selectedObjType == "Bioseq") {		
		formatObjectSelectedIndex = GetIndexByValue(form.FORMAT_TYPE,"ASN.1");		
		bioseqFormatHide = false;		
    }
    form.FORMAT_TYPE.selectedIndex = formatObjectSelectedIndex;     
	ShowOrHide(formatTypeHide,form.FORMAT_TYPE);
	if ($("bioseqFormat")) {
	    ShowOrHide(bioseqFormatHide,$("bioseqFormat"));
	    $("bioseqFormat").readOnly=true;		
	}
	if ($("pssmFormat")) {
	    ShowOrHide(pssmFormatHide,$("pssmFormat"));
	    $("pssmFormat").readOnly=true;	
	}
	if ($("pssmScFormat")) {
	    ShowOrHide(pssmScFormatHide,$("pssmScFormat"));
	    $("pssmScFormat").readOnly=true;	
	}	
	resetAdvView(hideAdvView);
}	

function ResetForm()
{
    //var defValNodes = cssQuery(".reset");	
    defValNodes = $("FormatForm").elements;
	for(i=0; i < defValNodes.length; i++) {	  	  
	  if(utils.hasClass(defValNodes[i],"reset"))
	                 setDefalValue(defValNodes[i]); 	  
	}
	if ($("FormatForm").FORMAT_OBJECT.type == "select-one") {
	    UpdateFormatTypes($("FormatForm"));
	    UpdateDisplayTypes($("FormatForm").FORMAT_OBJECT);
	}
	if($("FormatForm").RUN_PSIBLAST.checked) setDefalValue($("FormatForm").I_THRESH)
	else $("FormatForm").I_THRESH.value="";
	//resetOrganismSuggest($("FormatForm").FORMAT_ORGANISM);
	resetOrganismControls($("FormatForm").FORMAT_ORGANISM);
	//TO DO: add threshold
}

function LimitByHitlistSize(list)
{
    var listBreak = false;
    var optSel = false;
    for(i=0; i < list.options.length; i++) {    
        var optVal = parseInt(list.options[i].value ,10);
        var hitListSize = parseInt($("maxNumSeq").value ,10);                
        if(list.options[i].selected) optSel = true;
        if(optVal >= hitListSize)  {
            if(!optSel) {list.options[i].selected = true;}
            list.options.length = i + 1; 
            break;
        }                
    }             
}

function AddFormatOrgField(e) {
    AddOrgRow(e, "FORMAT_ORGANISM", "FORMAT_ORG_EXCLUDE");
}

function initSubmit() {


}

function adjustFormatOptions() 
{
    var alignView = $("FormatForm").ALIGNMENT_VIEW;
    var formatType = $("FormatForm").FORMAT_TYPE;
    var queryAnch =  formatType[formatType.selectedIndex].value == "HTML" && (alignView[alignView.selectedIndex].value != "Pairwise" && alignView[alignView.selectedIndex].value != "PairwiseWithIdentities");
    var dynFormatQA = !$("FormatForm").OLD_VIEW.checked && queryAnch;
    dynFormatPW = !$("FormatForm").OLD_VIEW.checked && formatType[formatType.selectedIndex].value == "HTML" && (alignView[alignView.selectedIndex].value == "Pairwise" || alignView[alignView.selectedIndex].value == "PairwiseWithIdentities");    
    
    UpdateDescriptions(dynFormatPW);
    if (dynFormatPW) {
        jQuery("#frmAln").addClass("hidden");
        if (!utils.hasClass($("shl"), "hidden")) jQuery("#shl").addClass("hidden"); //hide SHOW_LINKOUT
        jQuery("#gts").addClass("hidden"); //hide GET_SEQUENCE
        jQuery("#scf").removeClass("hidden");//show CDS_FEAT
        $("FormatForm").SHOW_LINKOUT.checked = true;        
    }
    else {
        if(dynFormatQA) $("FRM_ALIGNMENTS").selectedIndex = $("FRM_DESCRIPTIONS").selectedIndex;
        
        jQuery("#frmAln").removeClass("hidden");
        if (dynFormatQA) {
            if (!utils.hasClass($("shl"), "hidden")) jQuery("#shl").addClass("hidden"); //hide SHOW_LINKOUT
        }
        else {
            jQuery("#shl").removeClass("hidden");
        } 
        if (queryAnch) {
            jQuery("#scf").addClass("hidden"); //hide CDS_FEAT
        }
        else {//pairwise old_view=false
            jQuery("#scf").removeClass("hidden"); //hide CDS_FEAT
        }
        jQuery("#gts").removeClass("hidden"); //GET_SEQUENCE
    }
    if ($("blastSpec").value == "VecScreen") {
        adjustVecscreen(dynFormatPW);
    }
}

function adjustVecscreen(dynFormatPW) 
{
    var dfltDescrInd = 0; //0
    var dfltDynDescrInd = 5; //1000
    var dfltAlnInd = 6; //1000
    if (dynFormatPW) {
        utils.addClass($("lr"), "hidden");
        $("FRM_DESCRIPTIONS").selectedIndex = dfltDynDescrInd;        
    }
    else {
        utils.removeClass($("lr"), "hidden");
        $("FRM_DESCRIPTIONS").selectedIndex = dfltDescrInd;
    }
    $("FRM_ALIGNMENTS").selectedIndex = dfltAlnInd;
}


function UpdateDescriptions(removeZero) 
{
    if (removeZero) {        
        dispMenu = $("FormatForm").DESCRIPTIONS;
        dispMenu.remove(0);
    }
    else {
        dispMenu = $("FormatForm").DESCRIPTIONS;        
        if (dispMenu.options[0].value != "0") {            
            if (navigator.userAgent.match(/ie/i)) {
                dispMenu.add(new Option("0", "0"), 0);
            }
            else {
                dispMenu.add(new Option("0", "0"), dispMenu[0]);
            }
        }
	}
}

function InitDynFormatOptions() 
{
    if ($("OLD_VIEW")) {
        utils.addEvent($("FormatForm").OLD_VIEW, "click", adjustFormatOptions, false);
        utils.addEvent($("FormatForm").ALIGNMENT_VIEW,"change", adjustFormatOptions, false);
        utils.addEvent($("FormatForm").FORMAT_TYPE, "change", adjustFormatOptions, false);
        adjustFormatOptions();
    }
}

function InitFormatPage()
{
    if ($("FormatForm").FORMAT_OBJECT.type == "select-one") {
        UpdateDisplayTypes($("FormatForm").FORMAT_OBJECT);    
        UpdateFormatTypes($("FormatForm"));
        list = $("FormatForm").FORMAT_OBJECT;
        utils.addEvent(list, "change", function() {
            UpdateFormatTypes($("FormatForm"));
                               },
	                           false);
    }
    utils.addEvent($("resetAll"), "click",  ResetForm, false);         
    if($("maxNumSeq") != null) {
    if($("maxNumSeq").value != "") {
        LimitByHitlistSize($("FormatForm").DESCRIPTIONS);
        LimitByHitlistSize($("FormatForm").ALIGNMENTS);
        LimitByHitlistSize($("FormatForm").NUM_OVERVIEW);        
    }
    }    
    setupOrganismSuggest($("FormatForm").FORMAT_ORGANISM);
    utils.addEvent($("FormatForm"), "submit", function() {
                            adjustOrgVal($("FormatForm").FORMAT_ORGANISM);},
                    false);
                    
    if ($("addOrg")) utils.addEvent($("addOrg"), "click", AddFormatOrgField, false);
    InitDynFormatOptions();    
	/* add this code if decide image for View Report
	var imgButtons = jQuery("[class='viewReport']");
    for (var i = 0; i < imgButtons.length; i++) {
      var l = imgButtons[i];
      utils.addEvent(l, "click", function() {$("FormatForm").submit();}, false);          
      utils.addEvent(l, "mouseover", function() {l.src = l.getAttribute("mouseovImg");}, false);
      utils.addEvent(l, "mouseout", function() {l.src = l.getAttribute("mouseoutImg");}, false);
      utils.addEvent(l, "mousedown", function() {l.src = l.getAttribute("mousedownImg");}, false);
      utils.addEvent(l, "mouseup", function() {l.src = l.getAttribute("mouseupImg");}, false);
   }  
   */ 
}

utils.addEvent(window, 'load', InitFormatPage, false);






