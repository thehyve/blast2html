//=========================================================================================================
function RemoteDataProvider(sUrl) {
    this.iActiveRequests = 0;
    this.sUrl = sUrl;
}

//-------------------------------------------------------------------------------------------------------------
RemoteDataProvider.prototype.GetHttpObj = function() {
    var oHttpObj = null;
    try {
        oHttpObj = new ActiveXObject("Msxml2.XMLHTTP");
    } catch(e) {
        try {
            oHttpObj = new ActiveXObject("Microsoft.XMLHTTP")
        } catch(oc) {
            oHttpObj = null;
        }
    }
    if (!oHttpObj && typeof XMLHttpRequest != "undefined") {
        oHttpObj = new XMLHttpRequest();
    }
    return oHttpObj; 
}

//-------------------------------------------------------------------------------------------------------------
RemoteDataProvider.prototype.Request = function(sRequest, method) {
    var oHttpObj = this.GetHttpObj();
    if (null == oHttpObj) return;

    method = (!method) ? "GET" : "POST";
    var sURL = (method == "GET") ? this.sUrl + "?" + sRequest : this.sUrl;        //alert(sURL);    
    this.iActiveRequests++;
    var oThis = this;
    oHttpObj.onreadystatechange = function () {
        if (oHttpObj.readyState == 4 && oHttpObj.status == 200) {
            oThis.onSuccess(oHttpObj);
            oThis.iActiveRequests--;    
            oThis.onStop();    
        } else if(oHttpObj.readyState == 4 && oHttpObj.status != 200) {
            oThis.onError(oHttpObj);
            oThis.iActiveRequests--;    
            oThis.onStop();    
        }
    };
    
    if (oHttpObj.readyState != 0) oHttpObj.abort();
    this.onStart();
    oHttpObj.open(method, sURL, true);
//    oHttpObj.setRequestHeader('Cache-Control', 'no-cache');
    var params = (method == "GET") ? null : sRequest;
    if (params) {
        oHttpObj.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        oHttpObj.setRequestHeader("Content-length", params.length);
        oHttpObj.setRequestHeader("Connection", "close");
    }
    oHttpObj.send(params);
}

//-------------------------------------------------------------------------------------------------------------
RemoteDataProvider.prototype.onSuccess = function(obj) {
    alert(["success:", this.iActiveRequests, obj.responseText]);
}

//-------------------------------------------------------------------------------------------------------------
RemoteDataProvider.prototype.onStart = function() {
//    alert(["start:", this.iActiveRequests]);
}

//-------------------------------------------------------------------------------------------------------------
RemoteDataProvider.prototype.onStop = function() {
//    alert(["start:", this.iActiveRequests]);
}

//-------------------------------------------------------------------------------------------------------------
RemoteDataProvider.prototype.onError = function(obj) {
    //alert(["error:", this.iActiveRequests, obj.status]);
}


