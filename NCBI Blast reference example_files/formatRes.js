// JScript source code
/*************************new code begin *******************************************************/

function getHiddenFieldVal(elemName) {
    var val;
    var elem = document.getElementsByName(elemName);
    if (elem) {
        val = (elem.length > 1) ? elem[0].value : elem.value;
    }
    return val;
}

function getHiddenFieldParamString(elemName) {
    var ret = "";
    var val = getHiddenFieldVal(elemName);
    if (val) {
        ret = "&" + elemName + "=" + val;
    }
    return ret;
}

function elementInViewport(el) {
    if (!el) return;
    var rect = el.getBoundingClientRect();

    var myWidth = 0, myHeight = 0;
    if (typeof (window.innerWidth) == 'number') {
        //Non-IE
        myWidth = window.innerWidth;
        myHeight = window.innerHeight;
    } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
        //IE 6+ in 'standards compliant mode'
        myWidth = document.documentElement.clientWidth;
        myHeight = document.documentElement.clientHeight;
    } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
        //IE 4 compatible
        myWidth = document.body.clientWidth;
        myHeight = document.body.clientHeight;
    }
    //window.alert('Width = ' + myWidth);
    //window.alert('Height = ' + myHeight);


    //return (rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth)
    //return (rect.top >= 0 && rect.left >= 0 && rect.bottom <= myHeight && rect.right <= myWidth)
    return (rect.top >= 0 && rect.bottom <= myHeight);
}

function DisplayAlignFromDescription(elem) {
    var alignView = $("FormatForm").ALIGNMENT_VIEW;
    if (alignView[alignView.selectedIndex].value == "Pairwise" || alignView[alignView.selectedIndex].value == "PairwiseWithIdentities") {
        DisplayDynamicAlign(elem);
    }
    else {
        location.href = "#" + elem.getAttribute("seqID");        
    }
}	

//<a class="deflnDesc" hsp=<hsp_num> ind="<index>" gi="<gi>" id="deflnDesc_gi" href="#AlnHdrgi">desc</a>
//<div class="alnHdr" gi="<gi>" id="alnHdr_<index>">
function DisplayDynamicAlign(elem) {
    var currGi = elem.getAttribute("gi");
    var currInd = elem.getAttribute("ind");
    var stat = elem.getAttribute("stat");
    if (!currInd || !currGi) return;
    
    if (!stat || stat == "") {
        //Get 4(5) aligns before currInd and 4(5) aligns after
        ReadCurrentSeqAligns(currInd, 5);        
    }
    else if (stat == "read") {
        var indexes = getCurrIndexRange(currInd);
        if (indexes) {
            var msgID = "alnShow_" + indexes[0];
            location.href = "#" + msgID;
        }
    }
    else {
        //error status handling        
    }
}


function goToNextAlign(dtrID, next) {
    var currInd = parseInt($(dtrID).getAttribute("ind"));
    var rid = $("Rid").value;
    nextInd = (next) ? currInd + 1 : currInd - 1;

    if ($("deflnDesc_" + nextInd)) {
        currGi = $("deflnDesc_" + nextInd).getAttribute("seqID");
        scrollToGI = currGi;
        if (!$("deflnDesc_" + nextInd).getAttribute("stat") || $("deflnDesc_" + nextInd).getAttribute("stat") == "") {

            if (!next) {
                ReadPrevSeqAligns(currInd, 5, scrollToGI);
            }
            else {
                //Use this indexes = wasAlignRead(nextInd); to determine insertAfterID in ReadNextAligns!!!
                ReadNextSeqAligns(currInd, 5, scrollToGI);
            }

        }
        else {
            location.href = "#" + scrollToGI;
        }
    }
}

function goToDefLine(dtrID) {
    if ($("psiInp")) {
        var tbl = jQuery($(dtrID)).parents(".jig-ncbigrid"); //parent table
        togglerID = PsiBelowThresh(tbl[0].id) ? "showDescB1" : "showDescG1";
        jQuery($(togglerID)).ncbitoggler("open");
    }
}

/*
readAln.rid = rid;
readAln.startIndex = parseInt(currInd);
readAln.numSeq = parseInt(maxNumAligns);

readAln.insertAfterID = insertAfterID;
readAln.seqList = giList;
readAln.scrollToSeqID = scrollToGI;
*/
function ReadNextSeqAligns(currInd, maxNumAligns, scrollToGI) {
    var lastDispIdx = 0;
    var rid = $("Rid").value;

    var readAln = new Object();
    readAln.seqList = ""; //giList
    readAln.rid = rid;

    currInd = parseInt(currInd);

    if (currInd != 0 && $("deflnDesc_" + currInd)) {
        var par = utils.getParent($("aln_" + $("deflnDesc_" + currInd).getAttribute("seqID"))); //"alnShowReal_<ind>
        //alert(par.id);
        if (par) par = utils.getParent(par); //"alnShow_<ind>
        //alert(par.id);
        if (par) readAln.insertAfterID = par.id;
    }
    else {
        readAln.insertAfterID = "alnStart";
    }



    readAln.startIndex = currInd + 1;
    readAln.numSeq = maxNumAligns;
        
    checkIfAlnExceedsThreshold(readAln, currInd, maxNumAligns, "next");
        
    readAln.scrollToSeqID = (scrollToGI && scrollToGI != "") ? scrollToGI : "";
    readAln.hspSort = 0;
    ReadSeqAlignByIndex(readAln);
}

function ReadPrevSeqAligns(currInd, maxNumAligns, scrollToGI) {
    var lastDispIdx = 0;
    var rid = $("Rid").value;

    var readAln = new Object();
    readAln.seqList = ""; //giList
    readAln.rid = rid;

    currInd = parseInt(currInd);


    //sets readAln.insertAfterID and returns lastDispIdx;
    //Find the index of the previously displayed alignment
    lastDispIdx = getPrevDisplyedAlignInfo(currInd, readAln);

    readAln.startIndex = (currInd - lastDispIdx > maxNumAligns) ? (currInd - maxNumAligns) : lastDispIdx + 1;
    readAln.numSeq = currInd - readAln.startIndex;    //stopIndex = currInd
    
    checkIfAlnExceedsThreshold(readAln, currInd, readAln.numSeq, "prev");
        
    readAln.scrollToSeqID = (scrollToGI && scrollToGI != "") ? scrollToGI : $("deflnDesc_" + (currInd)).getAttribute("seqID");
    readAln.hspSort = 0;
    ReadSeqAlignByIndex(readAln);
}

//When descriptions is clicked - display maxNumAligns before currInd and maxNumAligns after currInd
function ReadCurrentSeqAligns(currInd, maxNumAligns) {
    var rid = $("Rid").value;
    var readAln = new Object();
    readAln.seqList = ""; //giList
    readAln.rid = rid;

    currInd = parseInt(currInd);


    //sets readAln.insertAfterID and returns lastDispIdx;
    //Find the index of the previously displayed alignment
    var lastDispIdx = getPrevDisplyedAlignInfo(currInd, readAln);

    //lastDispIdx = parseInt(lastDispIdx);
    readAln.startIndex = (currInd - lastDispIdx > maxNumAligns) ? (currInd - maxNumAligns) : lastDispIdx + 1;
    readAln.numSeq = parseInt(maxNumAligns * 2);
        
    checkIfAlnExceedsThreshold(readAln, currInd, maxNumAligns, "curr");
        
    readAln.scrollToSeqID = $("deflnDesc_" + currInd).getAttribute("seqID");
    readAln.hspSort = 0;
    ReadSeqAlignByIndex(readAln);
    g_DisableAutoCheck = true;
    location.href = "#alnShow_" + readAln.startIndex;
}




function setupDynHSPParams(readAln) 
{
    var currSeqInd = readAln.startIndex;
    hspNum = parseInt($("deflnDesc_" + currSeqInd).getAttribute("hsp"));
    alnLen = parseInt($("deflnDesc_" + currSeqInd).getAttribute("len"));
    var maxDispLen = parseInt($("maxDispAlnLen").value);//20000
    var minDispLen = parseInt($("minDispAlnLen").value);//2000
    if (alnLen > maxDispLen) {
        var lenPerMatch = alnLen / hspNum;        
        readAln.AlignDbPageSize = (lenPerMatch > minDispLen) ? 1 : Math.floor(minDispLen / lenPerMatch);
        readAln.AlignDbPageNum = 0;
        $("deflnDesc_" + currSeqInd).setAttribute("dynHsps", readAln.AlignDbPageSize);
    }
}



function getCurrSeqsAlnLen(currSeqInd) 
{
    var alnLen = 0;
    if ($("deflnDesc_" + currSeqInd) && (!$("deflnDesc_" + currSeqInd).getAttribute("stat") || $("deflnDesc_" + currSeqInd).getAttribute("stat") == "")) {
        alnLen = $("deflnDesc_" + currSeqInd).getAttribute("len");            
    }
    alnLen = (alnLen) ? parseInt(alnLen) : 0;
    return alnLen;
}

function checkTotalAlignLen(startIndex,stopIndex)
{
    var dispAlnLen = 0;
    var maxDispLen = parseInt($("maxDispAlnLen").value);    
    for (var i = startIndex; i <= stopIndex; i++) {
        alnLen = getCurrSeqsAlnLen(i);
        if (alnLen == 0) break;
        dispAlnLen += alnLen;        
    }
    return dispAlnLen;
}
//Get total align length for seq currSeqInd and
//"curr" surrounding countSeqs seqs + current, "prev" - previous countSeqs seqs, "next" - next countSeqs seqs
function getTotalAlignLen(readAln, currSeqInd, countSeqs, dispType) 
{
    var startIndex = readAln.startIndex;
    var stopIndex = readAln.startIndex + readAln.numSeq - 1;
    if (dispType == "curr") {//checks countSeqs before and countSeqs after current, including current                
        startIndex = Math.max(startIndex, currSeqInd - countSeqs);        
        stopIndex = Math.min(stopIndex, currSeqInd + countSeqs);        
    }
    else if(dispType == "prev") {        
        startIndex = Math.max(startIndex, currSeqInd - 1 - countSeqs);
        stopIndex = currSeqInd - 1;        
    }
    else {//next                                
        stopIndex = Math.min(stopIndex, currSeqInd + countSeqs + 1);
    }
    var totAlnLen = checkTotalAlignLen(startIndex,stopIndex);
    return totAlnLen;
}

function checkIfAlnExceedsThreshold(readAln,currSeqInd,maxNumAligns, dispType) 
{
    var maxDispLen = parseInt($("maxDispAlnLen").value);
    var totAlnLen = 0;
    var exc = false;
    for (var numSeq = 0; numSeq <= maxNumAligns; numSeq++) {
        totAlnLen = getTotalAlignLen(readAln, currSeqInd, numSeq, dispType);
        if(totAlnLen > maxDispLen) {
            break;
        }
    }
    if (totAlnLen > maxDispLen) {
        if (numSeq != 0) numSeq--;      
        if (dispType == "curr") {
            readAln.startIndex = Math.max(readAln.startIndex, currSeqInd - numSeq);
            //prev + 1(curr) + next            
            readAln.numSeq = (currSeqInd - readAln.startIndex) + 1 + numSeq;
        }
        else if (dispType == "prev") {
            readAln.startIndex = Math.max(readAln.startIndex, currSeqInd - 1 - numSeq);
            readAln.numSeq = numSeq + 1;
        }
        else { //"next" - readAln.startIndex stays
            readAln.numSeq = numSeq + 1;
        }
        
        if (readAln.numSeq == 1 && $("useAlignDB") && $("useAlignDB").value == "true") {
            setupDynHSPParams(readAln);            
        } 
                   
        exc = true;   
    }
    return exc;
}


//readAln.startIndex, readAln.numSeq, readAln.scrollToSeqID,readAln.insertAfterID should be set
function ReadSeqAlignByIndex(readAln) {
    var numAligns = 0;
    for (var i = readAln.startIndex; i < readAln.startIndex + readAln.numSeq; i++) {

        if (!$("deflnDesc_" + i)) {
            break;
        }
        if (!$("deflnDesc_" + i).getAttribute("stat") || $("deflnDesc_" + i).getAttribute("stat") == "") {            
            currGi = $("deflnDesc_" + i).getAttribute("seqFSTA");
            if (readAln.seqList != "") readAln.seqList += ",";
            readAln.seqList += currGi;
            numAligns++;
        }
        else {
            break;
        }
    }
    if (readAln.seqList != "") {        
        readAln.numSeq = parseInt(numAligns);
        ReadSeqAlignForSeqList(readAln);
    }
}


var g_DisplayeAlignsRanges = ""; //String in the format start1-stop1,start2-stop2...
//Find the range of indexes of displayed alignments for currAlnInd
//Returns array of 2 startIndex, stopIndex
function getCurrIndexRange(currAlinInd) {
    var currRange;
    var ranges = g_DisplayeAlignsRanges.split(",");
    for (var i = 0; i < ranges.length; i++) {
        var indexes = ranges[i].split("-");
        if (currAlinInd >= parseInt(indexes[0]) && currAlinInd <= parseInt(indexes[1])) {
            currRange = indexes;
            break;
        }
    }
    return currRange;
}


//Find the index of the previous  displayed alignment
function getPrevDisplyedAlignInfo(currInd, readAln) {
    readAln.insertAfterID = "alnStart";
    lastDispIdx = 0;
    for (var i = currInd - 1; i >= 1; i--) {
        indexes = getCurrIndexRange(i);
        if (indexes) {
            lastDispIdx = indexes[1];
            readAln.insertAfterID = "alnShow_" + indexes[0];
            break;
        }
    }
    return parseInt(lastDispIdx);
}


//setReadStatus
function setSeqAlnReadStatus(readAln, status) {
    for (var i = readAln.startIndex; i < readAln.startIndex + readAln.numSeq; i++) {
        if ($("deflnDesc_" + i)) {
            jQuery($($("deflnDesc_" + i))).attr("stat", status);
            if (status == "disp") {
                g_MaxDisplayedIndex = (i > g_MaxDisplayedIndex) ? i : g_MaxDisplayedIndex;
            }
        }
    }
}

/*
readAln.rid = rid;
readAln.seqList = giList;
readAln.startIndex = parseInt(idx);
readAln.insertAfterID = insertAfterID;
readAln.numSeq = parseInt(numSeq);
readAln.scrollToSeqID = scrollToGI;
*/
function SendReadSeqAlinRequest(readAln) {        
    blastUrl = "t2g.cgi";
    
    var rp = new RemoteDataProvider(blastUrl);


    rp.onSuccess = function(obj) {
        if ($("alignView")) utils.removeClass($("alignView"), "hidden");

        if ($("alnShow_" + readAln.startIndex)) {
            var moreHspsLink = getNextHspsLink(readAln);            
            jQuery($($("alnShowReal_" + readAln.startIndex))).html(obj.responseText + moreHspsLink, {
                'widgets': ['ncbipopper', 'ncbitoggler'],
                'configs': {
                    'ncbipopper': { hasArrow: true, arrowDirection: 'top' }
                }
            }); 
            setSeqAlnReadStatus(readAln, "disp");
            jQuery($("alnMsg_" + readAln.startIndex)).addClass("hidden");        
            //Saves start and stop indexes of loaded alignments in global variables
            saveIdxesForAutomaticLoad(readAln);
            jQuery($($("alnShowReal_" + readAln.startIndex))).find(".alnHdr").each(function(index) {
                var seqID = this.getAttribute("seqID");
                if(seqID) initAlignBatch(seqID);
            });

        }

        if (readAln.scrollToSeqID) {
            location.href = "#" + readAln.scrollToSeqID;
        }

    };
    rp.onError = function(obj) {        
        if ($("alignView")) utils.removeClass($("alignView"), "hidden");
        jQuery($("alnMsg_" + readAln.startIndex)).addClass("hidden");
        $("alnShowReal_" + readAln.startIndex).innerHTML = "<div class=\"erm\" id=\"erm_" + readAln.startIndex + "\">Error loading alignment ...<span class=\"db\">requests:" + this.iActiveRequests + " status:" + obj.status +
                          "</span><a class=\"gbd\" href=\"#\" onclick=\"ReSubmitReadSeqAligns(event," + readAln.startIndex + ")\">Try again<\a></div>";
    }
    var params = constructURLParams(readAln);
    if (readAln.numSeq == 1) {
        params += "&TOTAL_HSPS=" + $("deflnDesc_" + readAln.startIndex).getAttribute("hsp");
    }
    params += "&SEQ_LIST_START=" + readAln.startIndex;    
    
    var formatParams = constructFormatParams();
    params += formatParams;    
    
    //alert(params);
    rp.Request(params);
}


function constructURLParams(readAln) {
    var params;

    if ($("useAlignDB") && $("useAlignDB").value == "true") {

        var alignDbParams = "&USE_ALIGNDB=true";
        var batchID = document.getElementsByName("ALIGNDB_BATCH_ID");
        if (batchID) {
            alignDbParams += getHiddenFieldParamString("ALIGNDB_BATCH_ID");
            alignDbParams += getHiddenFieldParamString("ALIGNDB_MASTER_ALIAS");
            alignDbParams += getHiddenFieldParamString("ALIGNDB_CGI_HOST");
            alignDbParams += getHiddenFieldParamString("ALIGNDB_CGI_PATH");
        }
        alignDbParams += "&ALIGN_SEQ_LIST=" + readAln.seqList;
        alignDbParams += "&HSP_SORT=" + readAln.hspSort;

        if (readAln.hasOwnProperty("AlignDbPageNum")) {
            alignDbParams += "&ALIGNDB_PAGE_NUM=" + readAln.AlignDbPageNum;
            alignDbParams += "&ALIGNDB_PAGE_SIZE=" + readAln.AlignDbPageSize;
            alignDbParams += "&HSP_START=" + readAln.AlignDbPageSize * readAln.AlignDbPageNum;
        }

        params = "CMD=Get&RID=" + readAln.rid + "&OLD_BLAST=false&DESCRIPTIONS=0&NUM_OVERVIEW=0&DYNAMIC_FORMAT=on" + alignDbParams;
    }
    else {
        params = "CMD=Get&RID=" + readAln.rid + "&OLD_BLAST=false&DESCRIPTIONS=0&NUM_OVERVIEW=0&GET_SEQUENCE=on&DYNAMIC_FORMAT=on&ALIGN_SEQ_LIST=" + readAln.seqList + "&HSP_SORT=" + readAln.hspSort;
    }    
    if ($("phiPtInd")) {
        params += "&PHI_PTTRN_INDEX=" + $("phiPtInd")[$("phiPtInd").selectedIndex].value;
    }
    return params;
}

/*
readAln.rid = rid;
readAln.seqList = giList;
readAln.startIndex = parseInt(idx);
readAln.insertAfterID = insertAfterID;
readAln.numSeq = parseInt(numSeq);
readAln.scrollToSeqID = scrollToGI;
*/
/*1. Draw div with id="alnShow_index" class ="alnMsg" with the message listing gis nad indexes
2. Insert another div with id="alnShowReal_index and class="alnMsgR"
3. For "alnShow_index" set atrr indexes="startInd-stopInd"
4. Set global g_MaxReadMessageIndex - max index of displayed seqalign ??? - check this 
5. Add string "startInd-stopInd" to g_DisplayeAlignsRanges - comma separated indexes
6. Send read request
*/

function ReadSeqAlignForSeqList(readAln) {
    var text = "<div id=\"alnShow_" + readAln.startIndex + "\" class=\"alnMsg\"><div class=\"alnMsgS\" id=\"alnMsg_" + readAln.startIndex + "\">Loading alignment...<span class=\"db\"> for sequences " + readAln.seqList;
    var stopIndex = readAln.startIndex + readAln.numSeq - 1;
    var useAlignDB = ($("useAlignDB") && $("useAlignDB").value == "true") ? "AlignDB=on " : "";
    text += " " + useAlignDB + "Reading indexes " + readAln.startIndex + "-" + stopIndex + "</span></div>";
    text += "<div id=\"alnShowReal_" + readAln.startIndex + "\" class=\"alnMsgR\"></div></div>";
    var debugControl = "<div id=\"debug\"></div>";
    if (!$("debug")) {
        jQuery($($("descriptions"))).before(debugControl);
    }
    if (!$("alnShow_" + readAln.startIndex)) {        
        jQuery($($(readAln.insertAfterID))).after(text);
        jQuery($($("alnShow_" + readAln.startIndex))).attr("indexes", readAln.startIndex + "-" + stopIndex);
        jQuery($($("alnShow_" + readAln.startIndex))).attr("seqlist", readAln.seqList);
        g_MaxReadMessageIndex = (readAln.startIndex > g_MaxReadMessageIndex) ? readAln.startIndex : g_MaxReadMessageIndex;
        setSeqAlnReadStatus(readAln, "read");
        $("debug").innerHTML += ", " + useAlignDB + "Reading indexes " + readAln.startIndex + "-" + stopIndex;

        if (g_DisplayeAlignsRanges != "") g_DisplayeAlignsRanges += ",";
        g_DisplayeAlignsRanges += readAln.startIndex + "-" + stopIndex;

        SendReadSeqAlinRequest(readAln);
    }
    else if ($("alnShowReal_" + readAln.startIndex).innerHTML.indexOf("Error") != -1) {
        jQuery($("alnMsg_" + readAln.startIndex)).removeClass("hidden");
        jQuery($("erm_" + readAln.startIndex)).remove();        
        SendReadSeqAlinRequest(readAln);
    }
}


function ReSubmitReadSeqAligns(e,currInd) {
    var rid = $("Rid").value;
    if ($("alnShow_" + currInd)) {
        var indexRange = jQuery($("alnShow_" + currInd)).attr("indexes");
        var range = indexRange.split("-");


        var readAln = new Object();
        readAln.seqList = ""; //giList
        readAln.rid = rid;
        readAln.seqList = jQuery($("alnShow_" + currInd)).attr("seqlist");
        readAln.startIndex = parseInt(range[0]);
        readAln.numSeq = parseInt(range[1]) - parseInt(range[0]) + 1;
        readAln.hspSort = 0;
        ReadSeqAlignForSeqList(readAln);
        utils.preventDefault(e);
    }
}


var g_MaxReadMessageIndex = 0; //alnShow_idx with the message, deflnDesc_idx with stat="read"
var g_MaxDisplayedIndex = 0; //deflnDesc_idx with stat="disp" - last one in the set of N
var g_DisableAutoCheck = false;

var g_autoStartIdx = new Array();
var g_autoStopIdx = new Array();

function saveIdxesForAutomaticLoad(readAln) {
    var stopIndex = readAln.startIndex + readAln.numSeq - 1;
    g_autoStartIdx.push(readAln.startIndex); //1,20,25
    g_autoStopIdx.push(stopIndex);  //4,24,29    
    $("debug").innerHTML += ", displaying indexes " + readAln.startIndex + "-" + stopIndex;
}

function getNextHspsLink(readAln)
{
    var moreHspsLink = ""
    if (readAln.hasOwnProperty("AlignDbPageNum")) {
        var nextPageNum = readAln.AlignDbPageNum + 1;
        var currHspInd = readAln.AlignDbPageSize * nextPageNum;
        var argstring = readAln.startIndex + "," + currHspInd;                
        var currGi = $("deflnDesc_" + readAln.startIndex).getAttribute("seqId");
        var accs = $("deflnDesc_" + readAln.startIndex).getAttribute("accs");        
        var totalHsps = $("deflnDesc_" + readAln.startIndex).getAttribute("hsp");
        var prevHspInd = readAln.AlignDbPageSize * nextPageNum;
        var segs = (prevHspInd + 1) + "-" + (prevHspInd + readAln.AlignDbPageSize);        
        var moreHspsID = "nxHsp" + currGi + "_" + (prevHspInd + 1);

        moreHspsLink = $("dynHspTmpl").innerHTML.replace("@moreHspsID@", moreHspsID);        
        moreHspsLink = moreHspsLink.replace(/@accs@/g, accs);
        moreHspsLink = moreHspsLink.replace("@argstring@", argstring);
        moreHspsLink = moreHspsLink.replace(/@segs@/g, segs);
        moreHspsLink = moreHspsLink.replace("@totalHSP@", totalHsps);        
        moreHspsLink = moreHspsLink.replace(/@alignDbPageSize@/g, readAln.AlignDbPageSize);
        moreHspsLink = moreHspsLink.replace("@aln_prev_num@", prevHspInd);
        moreHspsLink = moreHspsLink.replace("@alnSeqGi@", currGi);
    }
    return moreHspsLink;
}


function ReadNextHSPSet(currSeqInd, currHSPNum) {
    var readAln = new Object();

    readAln.rid = $("Rid").value;
    readAln.seqList = $("deflnDesc_" + currSeqInd).getAttribute("seqFSTA");
    readAln.gi = $("deflnDesc_" + currSeqInd).getAttribute("seqId");
    dynHsps = $("deflnDesc_" + currSeqInd).getAttribute("dynHsps");
    readAln.startIndex = currSeqInd;
    readAln.numSeq = 1;
    if (dynHsps) {
        readAln.AlignDbPageNum = parseInt(currHSPNum) / parseInt(dynHsps);
        readAln.AlignDbPageSize = parseInt(dynHsps); //number of HSps to retrieve
    }
    if (currHSPNum != 0) {
        readAln.scrollToSeqID = "hsp" + +readAln.gi + "_" + (parseInt(currHSPNum) + 1);
        readAln.insertAfterID = "ar_" + readAln.gi + "_" + currHSPNum;
    }
    var sortLink = $("sa_" + readAln.gi);
    readAln.hspSort = (sortLink) ? parseInt(sortLink[sortLink.selectedIndex].value) : 0;
    SendReadSeqAlinSortHSPRequest(readAln);
}

function ReadNextHSPSetEvt(e, currSeqInd, currHSPNum) {
    ReadNextHSPSet(currSeqInd, currHSPNum);    
    utils.preventDefault(e);
}



function checkAutoAlignArray() {
    var stop = false;
    var start = false;
    var currAlignViewPos = $("alignView").getBoundingClientRect().top;
    if (currAlignViewPos < g_alignViewPos) {//scrolling down
        g_alignViewPos = currAlignViewPos;
        if (g_DisableAutoCheck) {
            g_DisableAutoCheck = false;
            return;
        }        
        for (i = 0; i < g_autoStopIdx.length; i++) {
            if (elementInViewport($("alnHdr_" + $("deflnDesc_" + g_autoStopIdx[i]).getAttribute("seqID")))) {
                //alert("Reading more aligns scrolling down!");
                var nextInd = parseInt(g_autoStopIdx[i] + 1);
                var currInd = g_autoStopIdx[i];
                if ($("deflnDesc_" + nextInd) && (!$("deflnDesc_" + nextInd).getAttribute("stat") || $("deflnDesc_" + nextInd).getAttribute("stat") == "")) {
                    ReadNextSeqAligns(currInd, 5);
                    stop = true;
                    break;
                }
            }
        }
        if (stop) g_autoStopIdx.splice(i, 1); //delete index from the array
    }
    else if (currAlignViewPos > g_alignViewPos) {//scrolling up
        g_alignViewPos = currAlignViewPos;
        //here maybe return if autoStop found!!!
        /* commenting automic read when scroll up */
        for (i = 0; i < g_autoStartIdx.length; i++) {
            if (elementInViewport($("alnHdr_" + $("deflnDesc_" + g_autoStartIdx[i]).getAttribute("seqID")))) {
                //alert("Reading more aligns scrolling up!");
                var currInd = g_autoStartIdx[i];
                //Check for condition here if go there at all!!! Check if do the same thing as for ReadNext!!!!
                if (currInd > 1) {
                    ReadPrevSeqAligns(currInd, 5);
                    start = true;
                    break;
                }
            }
        }
        if (start) g_autoStartIdx.splice(i, 1);
    }
    /*end of comment*/
}

var g_alignViewPos = 0;

function checkAutoAlignLoad() {


    checkAutoAlignArray();

    if (jQuery($($(window))).scrollTop() + jQuery($($(window))).height() >= jQuery($($(document))).height() - 100) {
        //alert("bottom!");       

        if ($("alnShowReal_" + g_MaxReadMessageIndex) && $("alnShowReal_" + g_MaxReadMessageIndex).innerHTML != "") {
            //if(!$("alnShow_" + maxReadMessageIndex)) {//g_MaxReadMessageIndex
            ReadNextSeqAligns(g_MaxDisplayedIndex, 5);
        }
    }
}


function GetPatternLocResults()
{
    form = $("results");
    if (!form.PHI_PTTRN_INDEX) {
        var el = document.createElement("input");
        el.name = "PHI_PTTRN_INDEX";
        el.value = $("phiPtInd")[$("phiPtInd").selectedIndex].value;
        form.appendChild(el);
    }
    else {
        form.PHI_PTTRN_INDEX.value = $("phiPtInd")[$("phiPtInd").selectedIndex].value;
    }
    form.submit();
}

function goToNextHSP(elem, next) {    
    var par = jQuery(elem).parent(); //parent span with class="alnParLinks"
    var parts = par[0].id.split("_"); //"hsp<seqid>_hspnum "hsp207524544_2"
    if (parts[0].indexOf("nxHsp") != -1) {
        parts[0] = parts[0].replace("nxHsp", "hsp");
    }
    nextID = (next) ? parts[0] + "_" + (parseInt(parts[1]) + 1) : parts[0] + "_" + (parseInt(parts[1]) - 1)
    
    gotoElem = jQuery($(nextID));
    if (gotoElem[0]) {
        a = jQuery(gotoElem).offset();
        window.scroll(0, a.top);
    }
    
    else {
        retrieveNextHSP(parts[0],parts[1]);
    }
    
}


//parts[0]//hsp<seqid>,    parts[1] hspnum
function retrieveNextHSP(currLinkID, currHSPNum) 
{
    var desLineID = currLinkID.replace("hsp", "dtr_"); //tr id
    var currSeqInd, totalHsps;
    jQuery($($(desLineID))).find(".deflnDesc").each(function(index) {
        currSeqInd = parseInt(this.getAttribute("ind"));
        totalHsps = parseInt(this.getAttribute("hsp"));
        dynHsps = this.getAttribute("dynHsps");
    });
    currHSPNum = parseInt(currHSPNum);
    if (currHSPNum < totalHsps && dynHsps) {        
        ReadNextHSPSet(currSeqInd, currHSPNum);
    }
}
/********Adding those functions back to formatRes.js to identify Uncaught ReferenceError: getUrlCompForCheckedField is not defined error********************************/
function getUrlCompForEntryField(elem) {
    var url = "";
    if (elem && elem.value != "") {
        url = "&" + elem.name + "=" + escape(elem.value);
    }
    return url;
}


function getUrlCompForCheckedField(elem) {
    var url = "";
    if (elem && elem.checked) {
        url = "&" + elem.name + "=" + elem.value;
    }
    return url;

}

function getUrlCompForOptionsField(elem) {
    var url = "";
    if (elem) {
        url = "&" + elem.name + "=" + elem[elem.selectedIndex].value;
    }
    return url;
}
/****************************************/

function constructFormatParams() {
    var formatParams = "";

    if ($("queryList")) {
        formatParams += "&QUERY_INDEX=" + $("queryList")[$("queryList").selectedIndex].value;
    }

    
    formatParams += getUrlCompForCheckedField($("FormatForm").SHOW_LINKOUT);
    formatParams += getUrlCompForCheckedField($("FormatForm").SHOW_CDS_FEATURE);
    formatParams += getUrlCompForCheckedField($("FormatForm").NCBI_GI);
    formatParams += getUrlCompForOptionsField($("FormatForm").ALIGNMENT_VIEW);
    formatParams += getUrlCompForOptionsField($("FormatForm").MASK_CHAR);
    formatParams += getUrlCompForOptionsField($("FormatForm").MASK_COLOR);    
    formatParams += getUrlCompForEntryField($("FormatForm").EXPECT_LOW);
    formatParams += getUrlCompForEntryField($("FormatForm").EXPECT_HIGH);
    formatParams += getUrlCompForEntryField($("FormatForm").PERC_IDENT_LOW);
    formatParams += getUrlCompForEntryField($("FormatForm").PERC_IDENT_HIGH);
    formatParams += getUrlCompForEntryField($("FormatForm").LINE_LENGTH);
    

    formatParams += getHiddenFieldParamString("BUILD_NAME");
    
    var serviceType = "";
    if ($("serviceType").value == "sra") {
        serviceType = "sra";
    }
    else if ($("clientType").value == "TMSmart_restricted") {
        serviceType = "restricted";
    }
    if (serviceType != "") {
        formatParams += "&BOBJSRVC=" + serviceType;
    }
    if ($("currQuery").value != "") {
        formatParams += "&CURR_QUERY_ID=" + $("currQuery").value;
    }
    
    return formatParams;
}

//readAln.seqList contains one gi only for this
function SendReadSeqAlinSortHSPRequest(readAln) {
    blastUrl = "t2g.cgi";    
    var rp = new RemoteDataProvider(blastUrl);


    rp.onSuccess = function(obj) {
        var moreHspsLink = (readAln.hasOwnProperty("AlignDbPageNum")) ? getNextHspsLink(readAln) : "";        
        var alnHtml = obj.responseText + moreHspsLink;
        initHSPRequest(readAln, obj.responseText + moreHspsLink,false);        
        if (readAln.scrollToSeqID) {
            location.href = "#" + readAln.scrollToSeqID;
        }                
    };
    rp.onError = function(obj) {        
        var currHspInd = (readAln.hasOwnProperty("AlignDbPageNum")) ? readAln.AlignDbPageSize * readAln.AlignDbPageNum : 0;
        var msgID = "erm_" + readAln.gi + "_" + (currHspInd + 1);
        if (!$(msgID)) {
            var msg = "<div class=\"erm\" att=\"1\" id=\"" + msgID + "\">Error loading alignment ...<span class=\"db\">status:" + obj.status +
                          "</span><a class=\"gbd\" href=\"#\" onclick=\"ReadNextHSPSetEvt(event," + readAln.startIndex + "," + currHspInd + 
                          ")\">Try again <span class=\"attmt\"></span> <\a></div>";
            initHSPRequest(readAln, msg, true);
        }
        else {
            var attNum = parseInt($(msgID).getAttribute("att")) + 1;
            $(msgID).setAttribute("att", attNum);
            jQuery($(msgID)).find(".attmt").each(function(index) {
                jQuery(this).html(", attempt " + attNum);
            });
        }
    }
    
    var params = constructURLParams(readAln);
    if (readAln.AlignDbPageSize) {    
        params += "&TOTAL_HSPS=" + $("deflnDesc_" + readAln.startIndex).getAttribute("hsp");
    }    
    params += "&SORT_ONE_ALN=on";
    var formatParams = constructFormatParams();
        
    params += formatParams;
    
    //alert(params);
    rp.Request(params);
}
function initHSPRequest(readAln, alnHtml, err) {
    var currHspInd = (readAln.hasOwnProperty("AlignDbPageNum")) ? readAln.AlignDbPageSize * readAln.AlignDbPageNum : 0;    
    if (currHspInd != 0) {
        readAln.insertAfterID = "ar_" + readAln.gi + "_" + currHspInd;
        jQuery($(readAln.insertAfterID)).after(alnHtml);
        moreHspsID = "nxHsp" + readAln.gi + "_" + (currHspInd + 1);
        jQuery($(moreHspsID)).remove();
        if (!err) {
            errMsgID = "erm_" + readAln.gi + "_" + (currHspInd + 1);
            jQuery($(errMsgID)).remove();            
        }
    }
    else {
        jQuery($("alnAll_" + readAln.gi)).html(alnHtml);
    }    
}

function SortHSPAlnSel(e, sortLink) {//example id="sa_207524544"
    var readAln = new Object();

    
    var desLineID = sortLink.id.replace("sa", "dtr"); //tr id
    var seqInd;

    jQuery($($(desLineID))).find(".deflnDesc").each(function(index) {        
        seqInd = this.getAttribute("ind");
    });    
    
    ReadNextHSPSet(parseInt(seqInd), 0);
}


function configDescriptions(e,btn,dlgId) 
{
    var suffix = PsiBelowThresh(dlgId);    
    var colmnsInfId = "cfcDsInf" + suffix;
    var tblID = "dscTable" + suffix; //"dscTable[_psiw]"
    var showAllColId = "shcl" + suffix;    
    var chkBoxes = $C("checkbox", "type", $(dlgId), "input");
    if (!utils.hasClass(btn, "cnc")) $(colmnsInfId).value = "";    
    for (i = 0; i < chkBoxes.length; i++) {
        var check;
        if (utils.hasClass(btn, "cnc")) {//cancel
            if ($(colmnsInfId).value.indexOf(chkBoxes[i].value) != -1 && !chkBoxes[i].checked) {
                check = true;
            }
            else if ($(colmnsInfId).value.indexOf(chkBoxes[i].value) == -1 && chkBoxes[i].checked) {
                check = false;
            }
        }
        else if (utils.hasClass(btn, "rdf") && !chkBoxes[i].checked) {
            check = true;
        }
        if (typeof (check) != 'undefined') {
            chkBoxes[i].checked = check;
            showHideCol(tblID,parseInt(chkBoxes[i].value), !check);
        }
        if (!utils.hasClass(btn, "cnc")) {
            if (chkBoxes[i].checked) { //OK
                if ($(colmnsInfId).value != "") $(colmnsInfId).value += ",";
                $(colmnsInfId).value += chkBoxes[i].value;
            }
        }
    }
    if ($(colmnsInfId).value != $(colmnsInfId).getAttribute("defval")) {//defval = "2,3,4,5,6,7,8"
        jQuery($(showAllColId)).removeClass("hidden");
    }
    else {
        jQuery($(showAllColId)).addClass("hidden");
    }

    var chConfig = $("cfcDsSave").value != $(colmnsInfId).value;
    
    var cfds = document.getElementsByName("CONFIG_DESCR");        
    if (cfds) {
        for (i = 0; i < cfds.length; i++) {
            cfds[i].value = $(colmnsInfId).value;
        }
    }    
    $("cfcDsSave").value = $(colmnsInfId).value;
    if (chConfig) SaveConfigTable();
    jQuery(document.body).click();
    utils.preventDefault(e);
}



function initDescConfig() 
{
    initConfigColumns("dsConfig");
    if ($("psiw") && utils.hasClass($("psiw"), "shown")) {
        initConfigColumns("dsConfig_psiw");
    }        
}


function initConfigColumns(cnfDlgID) 
{
    var suffix = PsiBelowThresh(cnfDlgID);
    //cnfDlgID is "dsConfig[_psiw]"
    var colmnsInfId = "cfcDsInf" + suffix;
    var tblID = "dscTable" + suffix; //"dscTable[_psiw]"
    var showAllColId = "shcl" + suffix;
    
    if (navigator.userAgent.match(/ie/i)) {
        if ($("FormatForm").NCBI_GI.checked || $("serviceType").value == "sra") {        
            jQuery($(tblID)).find("th.c1").each(function(index) {            
                db = getHiddenFieldVal("DATABASE");
                var width = (db.match(/WGS/i) || db.match(/Whole_Genome_Shotgun_contigs/i)) ? "16em" : "14em";
                jQuery(this).css("width", width);
            });        
        }
    }

    jQuery($(tblID)).find("tr.first").each(function(index) {
        jQuery(this).find("a.dcs").each(function(index) {        
           jQuery(this).bind("click", function(e) { checkConfig(this); });           
        });
    });

    jQuery($(cnfDlgID)).find("button").each(function(index) {
        jQuery(this).bind("click", function(e) { configDescriptions(e, this, cnfDlgID); });
    });

        
    jQuery($(cnfDlgID)).bind("click", function(e) { e.stopPropagation(); });

    $(colmnsInfId).value = getHiddenFieldVal("CONFIG_DESCR");
    if ($(colmnsInfId).value == "" || $(colmnsInfId).value == "undefined") {
        $(colmnsInfId).value = $(colmnsInfId).getAttribute("defval");
    }
    if ($(colmnsInfId).value != $(colmnsInfId).getAttribute("defval")) {//defval = "2,3,4,5,6,7,8"
        jQuery($(showAllColId)).removeClass("hidden");
    }    
    else {
        jQuery($(showAllColId)).addClass("hidden");
    }
    var chkBoxes = $C("checkbox", "type", $(cnfDlgID), "input")
    for (i = 0; i < chkBoxes.length; i++) {
        jQuery(chkBoxes[i]).bind("click", configColumn);
        if ($(colmnsInfId).value.indexOf(chkBoxes[i].value) != -1) {
            chkBoxes[i].checked = true;
        }
        else {
            //jQuery($(tblID)).ncbigrid("hideColumn", chkBoxes[i].value);
            showHideCol($(tblID), chkBoxes[i].value, true); 
        }
    }
}
function showAllCol(e,elem) 
{
    var suffix = PsiBelowThresh(elem.id);
    var rdf = "dscRsDf" + suffix;
    jQuery($(rdf)).click();//click "restore defaults'
    utils.preventDefault(e);
}


function configColumn() {
    var suffix = PsiBelowThresh(this.id);
    var tblID = "dscTable" + suffix; //"dscTable[_psiw]"
    
    cCls = "c" + this.value;
    if (this.checked) {//show        
        showHideCol(tblID,parseInt(this.value), false);        
    }
    else {
        showHideCol(tblID,parseInt(this.value), true);        
    }
}

function showHideCol(tblID, columnIndex, hide) {

    if ($("Transcr")) {
        colHidden = utils.hasClass($("c" + columnIndex), "ui-ncbigrid-column-hidden");
        hide = hide && !colHidden;
        show = !hide && colHidden;
    }
    else {
        show = !hide;
    }    
    if (hide) {
        jQuery($(tblID)).ncbigrid("hideColumn", columnIndex);        
    }
    else if (show) {
        jQuery($(tblID)).ncbigrid("showColumn", columnIndex);    
    }
    if ($("Transcr") && (hide || show) ) {
        var colsp = parseInt($("Transcr").getAttribute("colspan"));
        colsp = (hide) ? colsp - 1 : colsp + 1;
        $("Transcr").setAttribute("colSpan", colsp);
        if ($("GnmSeq")) $("GnmSeq").setAttribute("colSpan", colsp);
    }
}

function checkConfig(lnk) {
    var cnfCol = "&CONFIG_DESCR=" + $("cfcDsSave").value;
    lnk.href = lnk.href + cnfCol + "#sort_mark";    
}

function DisplayAlignFromGraphics(seqID,e) //SeqID = gi if exists
{
    var dflLineLinks = $C(seqID, "gi", document, "a");    
    for (i = 0; i < dflLineLinks.length; i++) {
        jQuery(dflLineLinks[i]).click();
        break;
    }    
    location.href = dflLineLinks[i].href;
}



function initDescSelect() 
{

    jQuery("#cntDesc").find("a").each(function(index) {
        jQuery(this).bind("click", configDescrSelect);
    });
    jQuery("#cntSelN").click();
    jQuery("#descTblCtrl").find("a[view]").each(function(index) {
        jQuery(this).bind("click", DisplaySelectedView);
    });
    if ($("psiw") && utils.hasClass($("psiw"), "shown")) {
        jQuery("#cntDesc_psiw").find("a").each(function(index) {
            jQuery(this).bind("click", configDescrSelect);
        });
        jQuery("#cntSelN_psiw").click();
        jQuery("#descTblCtrl_psiw").find("a[view]").each(function(index) {
            jQuery(this).bind("click", DisplaySelectedView);
        });
    }
    
    
    //jQuery("#dsConfig").bind("click", function(e) { e.stopPropagation(); });??

}

function DisplaySelectedView(e) {
    if (this.getAttribute("view") == "graph") {    //seqviewer
        ViewSelectedSeqViewer(e,this);
    }
    else {
        if (this.getAttribute("view") == "tree") {    //seqviewer
            $("scrWidth").value = screen.width;
            $("scrHeight").value = screen.height;
        }
        ViewSelectedSeqsEx(e, this);
    }
}

function PsiBelowThresh(elemID) 
{
    var suffix = "";
    if (elemID.indexOf("_psiw") != -1) {
        suffix = "_psiw";
    }
    return suffix;
}

function ViewSelectedSeqsEx(e,elem) {
    var sbmForm = elem.getAttribute("frm");
    var seqList = elem.getAttribute("seqList");

    var cnfElem = utils.getParent(elem); //.cnf div    
    var suffix = PsiBelowThresh(cnfElem.id);
    var tblID = "dscTable" + suffix;

    $(seqList).value = createSelseqString(tblID,true);
    $(seqList).value = $(seqList).value.replace(/ti:/g, ""); //For traces
    if ($(seqList).value.indexOf("dbSNP") != -1) {
        $(seqList).value = $(seqList).value.replace(/dbSNP:rs/g, ""); //For snp
        elem.href = $(sbmForm).action + $(seqList).value;
        elem.target = "new";
    }
    else {
        $(sbmForm).submit();
        utils.preventDefault(e);
    }    
}

function ViewSelectedSeqsTree(e) {
    $("scrWidth").value = screen.width;
    $("scrHeight").value = screen.height;
}

function initSeqViewerGet(seqList) {
    if (seqList.length >= 2000) {    
        seqList = seqList.substr(0,2000);
        lastComma = seqList.lastIndexOf(",");
        seqList = seqList.substr(0,lastComma);             
    }
    $("seqViewParams").name = "RID";
    $("seqViewParams").value = $("ridParam").value + "[" + seqList + "]";
}

function ViewSelectedSeqViewer(e, elem) 
{
    var cnfElem = utils.getParent(elem); //.cnf div    
    var suffix = PsiBelowThresh(cnfElem.id);
    var tblID = "dscTable" + suffix;

    //change to false when new verison of seqVier is installed in production
    var seqList = createSelseqString(tblID, false);
    $("sbmtGraphics").action = $("seqViewUrl").value;
    
    var rp = new RemoteDataProvider("url2nc.cgi");
    rp.onSuccess = function(obj) {
        var jsnResp = JSON.parse(obj.responseText);
        ncid = jsnResp.ncid;

        if (ncid != "") {
            $("seqViewParams").name = "rkey";
            $("seqViewParams").value = ncid;
        }
        else {
            initSeqViewerGet(seqList);
        }
        $("sbmtGraphics").submit();        
    };
    rp.onError = function(obj) {
        initSeqViewerGet(seqList);
        $("sbmtGraphics").submit();
        utils.preventDefault(e);   
    }
    var params = $("ridParam").value + "[" + seqList + "]";    
    rp.Request(params, "POST");
    utils.preventDefault(e);   
}

function configDescrSelect(e) {    
    var sel = this.getAttribute("sel");    
    if (sel) {
        var selNum = 0;
        var check = (sel == "all") ? true : false;

        var suffix = PsiBelowThresh(this.id);
        var tblID = "dscTable" + suffix;
        var toolbarID = "descTblCtrl" + suffix;
        var selElID = "slcNum" + suffix;

        jQuery($(tblID)).find("input[type='checkbox'].cb").each(function(index) {
            jQuery(this)[0].checked = check;
            if (check) selNum++;
        });
        enableDescrLinks(selNum, toolbarID, selElID);        
    }     
    utils.preventDefault(e);
}



function enableDescrLinks(selNum, toolbarID, selElID) {
    jQuery($(toolbarID)).find("a[minSlct]").each(function(index) {
        var minSelected = this.getAttribute("minSlct");
        minSelected = parseInt(minSelected);
        if (selNum >= minSelected) {
            this.removeAttribute("disabled");
        }
        else {
            this.setAttribute("disabled", "disabled");
        }
    });    
    $(selElID).innerHTML = selNum;
}



function configDescrLinks(e, elem) 
{

    ncbi.sg.ping(elem, "click", elem.checked ? "checked=true" : "checked=false");     
    var par = jQuery(elem).parents(".jig-ncbigrid");//parent table
    if (par) {
        var suffix = PsiBelowThresh(par[0].id);
        var tblID = "dscTable" + suffix;
        var toolbarID = "descTblCtrl" + suffix;
        var selElID = "slcNum" + suffix;
        
        var currSelNum = parseInt($(selElID).innerHTML);
        var selNum = elem.checked ? currSelNum + 1 : currSelNum - 1;
        enableDescrLinks(selNum, toolbarID, selElID);
    }
}
/***Download code begin****/

function initDownLoadPopup(dwnDialog) {

    jQuery(dwnDialog).find("button").each(function(index) {        
        jQuery(this).bind("click", execDownLoad);        
    });

    jQuery(dwnDialog).bind("click", function(e) { e.stopPropagation(); });
}

function initDescDownLoad() {
    initDownLoadPopup($("dsDownload"));

    if ($("psiw") && utils.hasClass($("psiw"), "shown")) {
        initDownLoadPopup($("dsDownload_psiw"));        
    }
}

function initAlignDownLoad(navObj) 
{
    var seqID = navObj.seqID;
    var dwnDialog = $("dlgDwnl_" + seqID);
    jQuery(dwnDialog).find("button").each(function(index) {        
        jQuery(this).bind("click", execDownLoad);        
    });

    var dwnFSTW = $("dwFST_" + seqID);//whole seq
    var dwnFSTAl = $("dwFSTAl_" + seqID);//aligned regions
    
    if(dwnFSTW) dwnFSTW.setAttribute("seqfsta", navObj.currSeqID); 
    if(dwnFSTAl) dwnFSTAl.setAttribute("seqfsta", navObj.currSeqID); 
    
    jQuery(dwnDialog).bind("click", function(e) { e.stopPropagation(); });    
}

    
function execDownLoad(e) {
    if (!utils.hasClass(this, "cnc")) {
        par = utils.getParent(this);
        dwnDialog = utils.getParent(par); //parent dialog with popDl class
        var descr = (this.id == "dw_cont" || this.id == "dw_cont_psiw") ? true : false;
        jQuery(dwnDialog).find("input").each(function(index) {
            if (this.checked) {
                submitDownLoad(this, descr);
            }
        });
    }
    jQuery(document.body).click();
    utils.preventDefault(e);      
}

function submitDownLoad(radioElem, descr) {    
    var toolURL = radioElem.getAttribute("url");
    if (toolURL) {
        if (descr) {
            var getGi = radioElem.getAttribute("getGi");
            getGi = (getGi) ? true : false;
            
            var tblID = "dscTable";
            var suffix = PsiBelowThresh(radioElem.id);
            tblID += suffix;

            $("selDnSeqs").value = createSelseqString(tblID,getGi);
        }
        else {
            var seqfsta = radioElem.getAttribute("seqfsta");
            $("selDnSeqs").value = (seqfsta) ? seqfsta : radioElem.getAttribute("getGi");
        }
        var addParams = "";
        if (radioElem.getAttribute("addParam")) {
            addParams = addDwnlParams();
        }
        var submitName = radioElem.getAttribute("sbName")
        $("selDnSeqs").name = (submitName) ? submitName : "ALIGN_SEQ_LIST";
        $("dwdlSubmit").action = toolURL + addParams;
        $("dwdlSubmit").submit();
    }       
    else {
        var sbFunction = radioElem.getAttribute("sbFunc");        
        if (sbFunction) {
            eval(sbFunction + "(radioElem, descr)");
        }        
    }
}


function initDownLoadFSTA(radioElem, descr) 
{
    if (descr) {
    
        var tblID = "dscTable";
        var suffix = PsiBelowThresh(radioElem.id);
        tblID += suffix;

        $("sbmtFASTA").ALIGN_SEQ_LIST.value = createSelseqString(tblID,false);
    }
    else {        
        $("sbmtFASTA").ALIGN_SEQ_LIST.value = radioElem.getAttribute("seqfsta");
    }
    $("sbmtFASTA").DOWNLOAD_TYPE.value = radioElem.getAttribute("fstaDWType");
    
    $("sbmtFASTA").DATABASE.value = getHiddenFieldVal("DATABASE");
    if ($("useAlignDB") && $("useAlignDB").value == "true") {//temp checkbox    
        var batchID = document.getElementsByName("ALIGNDB_BATCH_ID");
        if (batchID) {
            $("sbmtFASTA").ALIGNDB_BATCH_ID.value = getHiddenFieldVal("ALIGNDB_BATCH_ID");
            $("sbmtFASTA").ALIGNDB_MASTER_ALIAS.value = getHiddenFieldVal("ALIGNDB_MASTER_ALIAS");
            $("sbmtFASTA").ALIGNDB_CGI_HOST.value = getHiddenFieldVal("ALIGNDB_CGI_HOST");
            $("sbmtFASTA").ALIGNDB_CGI_PATH.value = getHiddenFieldVal("ALIGNDB_CGI_PATH");
        }
    }
    $("sbmtFASTA").submit();    
}

function createSelseqString(tblID,getGi) {    
    var selSeqs = "";
    jQuery($(tblID)).find("input[type='checkbox'].cb").each(function(index) {
        if (jQuery(this)[0].checked) {
            if (selSeqs != "") selSeqs += ",";
            if (getGi) {
                selSeqs += jQuery(this)[0].value;
            }
            else {
                var linkID = jQuery(this)[0].id.replace("chk", "deflnDesc");
                selSeqs += $(linkID).getAttribute("seqFSTA");
            }
        }
    });
    return selSeqs;
}

/***Download code end****/

/***Init navigation code begin **/

function initNavigation(navObj) {    
    initNextAlnLink(navObj, true);
    initNextAlnLink(navObj, false);        
}


function initNavInfo(navObj) {
    var currInd = parseInt($("dtr_" + navObj.seqID).getAttribute("ind"));
    nextInd = currInd + 1;
    prevInd = currInd - 1;
    
    navObj.currSeqID = "";
    navObj.nextSeqID = "";
    navObj.prevSeqID = "";
        
    if ($("deflnDesc_" + nextInd)) {
        navObj.nextSeqID = $("deflnDesc_" + nextInd).getAttribute("accs");
        if(navObj.nextSeqID =="") navObj.nextSeqID = $("deflnDesc_" + nextInd).getAttribute("seqFSTA");
    }
    if ($("deflnDesc_" + prevInd)) {
        navObj.prevSeqID = $("deflnDesc_" + prevInd).getAttribute("accs");
        if (navObj.prevSeqID == "") navObj.prevSeqID = $("deflnDesc_" + prevInd).getAttribute("seqFSTA");
    }
    if ($("deflnDesc_" + currInd)) {
        navObj.currSeqID = $("deflnDesc_" + currInd).getAttribute("seqFSTA");        
    }
}


function initNextAlnLink(navObj, next) {

    var nextLinkEl = (next) ? $("alnNxt_" + navObj.seqID) : $("alnPrv_" + navObj.seqID);
    var nextSeqid = (next) ? navObj.nextSeqID : navObj.prevSeqID;
    
    if (nextLinkEl) {
        if (nextSeqid != "") {
            var text = (next) ? "next" : "previous";
            nextLinkEl.setAttribute("title", "Go to " + text + " alignment for " + nextSeqid);
        }
        else {
            nextLinkEl.setAttribute("disabled", "disabled");
        }
    }
}
function scan(link) {
    var init = link.getAttribute("init");
    if (!init) {
        ncbi.sg.scanLinks(link);
        link.setAttribute("init","on");
    }
}

function initWidth(seqID) {
    var lineLengthElem = $("FormatForm").LINE_LENGTH;
    var lineLength = parseInt(lineLengthElem[lineLengthElem.selectedIndex].value);
    if (parseInt(lineLengthElem.getAttribute("defval")) == lineLength) return;
    
    var relWidth = (lineLength > 90) ? "12%" : "15%";
    var charWidth = (navigator.userAgent.match(/ie/i)) ? 8 : 7;
    lineLength = (lineLength + parseInt(17)) * charWidth;
    var width = lineLength + "px";
    jQuery($("alnAll_" + seqID)).find("div.dflLnk").each(function(index) {
        jQuery(this).css("width", width);
    });
    jQuery($("alnAll_" + seqID)).find("table.alnParams").each(function(index) {
        jQuery(this).css("width", width);
    });    
    jQuery($("relInf_" + seqID)).css("width", relWidth);
}


/***Init navigation code end **/
function initAlignBatch(seqID)
{
    var navObj = new Object();
    navObj.seqID = seqID;
    initNavInfo(navObj);

    initAlignDownLoad(navObj);
    initNavigation(navObj);
    ncbi.sg.scanLinks($("alnNxt_" + seqID));
    ncbi.sg.scanLinks($("alnPrv_" + seqID));
    if ($("serviceType").value == "vecscreen") {
        utils.addClass($("alnDsc_" + seqID), "hidden");
    }
    ncbi.sg.scanLinks($("alnDwnld_" + seqID));
    jQuery($("csLinks_" + seqID)).find("a").each(function(index) {
        ncbi.sg.scanLinks(this);
    });
    jQuery($("relInf_" + seqID)).find("a").each(function(index) {
        ncbi.sg.scanLinks(this);
    });
    jQuery($("rng_" + seqID)).find("a").each(function(index) {
        ncbi.sg.scanLinks(this);
    });
    jQuery($("dln_" + seqID)).find("a").each(function(index) {
        ncbi.sg.scanLinks(this);
    });
    initWidth(seqID); 
/*        
    jQuery($("alnHdr_" + seqID)).find("a").each(function(index) {
        ncbi.sg.scanLinks(this);
    });
    jQuery($("aln_" + seqID)).find("a").each(function(index) {
        ncbi.sg.scanLinks(this);
    });
*/    
}

function SaveConfigTable() {
    blastUrl = "fmtsave.cgi";
    

    var rp = new RemoteDataProvider(blastUrl);


    rp.onSuccess = function(obj) {
        //alert("success");
    };
    rp.onError = function(obj) {
        //alert("error");
    }    

    var program = getHiddenFieldVal("PROGRAM");
    var rid = getHiddenFieldVal("RID");
    var blastSpec = getHiddenFieldVal("BLAST_SPEC");
    var params = "CMD=Get&RID=" + rid + "&ViewReport=on&PROGRAM=" + program + "&SAVE_INDV_FRM_OPTION=on&CONFIG_DESCR=" + $("cfcDsSave").value;
    if(blastSpec) {
        params += "&BLAST_SPEC=" + blastSpec;
    }     
    rp.Request(params,"POST");
}

function removeRID() {
    var rid = document.getElementsByName("RID");
    for (var i = 0; i <= rid.length; i++) {
        jQuery(rid[i]).remove();        
    }
}

function initAdvancedView()
{
    if ($("dsConfig")) {
    
        var alnView = getHiddenFieldVal("ALIGNMENT_VIEW");
        if (alnView == "Pairwise" || alnView == "PairwiseWithIdentities") {
            var rid = getHiddenFieldVal("RID");        
            ReadNextSeqAligns(0, 5);            
            g_alignViewPos = $("alignView").getBoundingClientRect().top;
            utils.addEvent(window, "scroll", checkAutoAlignLoad, false);
        }
        list = $("phiPtInd");
        if (list) {
            utils.addEvent(list, "change", GetPatternLocResults, false);
        }                
        initDescConfig();
        initDescSelect();
        initDescDownLoad();
        if ($("psiInp")) {
            var nextIter = document.getElementsByName("NEXT_I");
            for (var i = 0; i < nextIter.length; i++) {
                utils.addEvent(nextIter[i], "click", removeRID, false);
            }
        }
    }
}

//takes care of jQuery calls to elements that have dots in id like id= "SRA34456.3.4"
function initjQry() 
{
    var oldCreate = jQuery.ui.ncbipopper.prototype._create;
    jQuery.ui.ncbipopper.prototype._create = function() {
        var destSelector = this.options.destSelector || this.options.sourceSelector || this.element.prop("hash");
        this.options.destSelector = destSelector.replace(/\./g, "\\.");
        oldCreate.apply(this, arguments);
    }
}
utils.addEvent(window,
				"load", initAdvancedView,
				false);

initjQry()

/* If user agent has "safari" in it, include safari-specific stylesheet. */
if (navigator.userAgent.match(/ie/i)) {
    document.write("<link rel='stylesheet' type='text/css' href='css/ie-descriptions.css'  media='screen'/>");
}
/*****************************new code end*********************************************************************/
