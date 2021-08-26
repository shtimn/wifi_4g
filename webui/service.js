define([ 'underscore', 'jquery', 'config/config'], function(_, $, config) {
    /**
     * Service
     * @module service
     * @class service
     */
    var wifiCallbackDestination = window;
    var unknownErrorObject = {
        errorType : 'UnknownError',
        errorId : '123',
        errorText : 'UnknownError'
    };
    
    var isTest = config.IS_TEST;
    if (isTest) {
        $("#buttom-bubble").hide();
    }
    var timerUpdaterEnable = true;
    // in Product Env, isTest should  be false
    /**
     * Ajax同步调用
     * @method syncRequest
     * @param {Object} params json参数对象
     * @param {Boolean} isPost 是否为post方法
     */
    function syncRequest(params, isPost) {
        return ajaxRequest(params, null, null, false, isPost);
    }

    /** wenping
     * Ajax异步调用
     * @method asyncRequest
     * @param {Object} params json参数对象
     * @param {Function} successCallback 成功回调函数
     * @param {Function} errorCallback 失败回调函数
     * @param {Boolean} isPost 是否为post方法
     */
    function asyncRequest(params, successCallback, errorCallback, isPost) {
        ajaxRequest(params, successCallback, errorCallback, true, isPost);
    }

    /** wenping
     * Ajax异步调用
     * @method ajaxRequest
     * @param {Object} params json参数对象
     * @param {Function} successCallback 成功回调函数
     * @param {Function} errorCallback 失败回调函数
     * @param {Boolean} async 是否为异步方法
     * @param {Boolean} isPost 是否为post方法
     */
    function ajaxRequest(params, successCallback, errorCallback, async, isPost) {
        var result = null;
        if(params.isTest){
                result = simulate.simulateRequest(params, successCallback, errorCallback, async, isPost);
                if (async) {
                    setTimeout(function() {successCallback(result);}, getRandomInt(120) + 50);
                    //successCallback(result)
                    return;
                }else{
                    return result;
                }
        }
        $.ajax({
            type : !!isPost ? "POST" : "GET",
            url : isPost ? "/goform/goform_set_cmd_process" : params.cmd ? "/goform/goform_get_cmd_process"
                    : "/goform/goform_set_cmd_process",
            data : params,
            dataType : "json",
            async : !!async,
            cache : false,
            error : function(data) {
                log("ajax error callback");
                if (async) {
                    errorCallback(data);
                } else if(data.status == 200) {
                    result = jQuery.parseJSON('(' + data.responseText + ')');
                }
            },
            success : function(data) {
                log($.extend(params, data));
                if (async) {
                    successCallback(data);
                } else {
                    result = data;
                }
            }
        });
        if (!async) {
            return result;
        }
    }

    /**
     * doStuff业务处理函数
     * @method doStuff
     * @param {Object} params json参数对象
     * @param {Object} result 错误对象
     * @param {Function} prepare 数据准备函数
     * @param {Function} dealMethod 结果适配函数
     * @param {Object} errorObject 默认错误对象
     * @param {Boolean} isPost 是否为post方法
     */
    function doStuff(args, result, prepare, dealMethod, errorObject, isPost) {
        var params = args[0], callback = args[1], errorCallback = args[2];
        var objectToReturn;

        if (result && typeof result.errorType === 'string') {
            objectToReturn = $.extend(unknownErrorObject, result);

            if (!callback) {
                // sleep(DelayOnEachCallMillis);
                return objectToReturn;
            }
            doCallback(objectToReturn, callback, errorCallback);
        } else {
            objectToReturn = $.extend({}, result); // Duplicate it.

            var requestParams;
            if (prepare) {
                requestParams = prepare(params, isPost);
            } else {
                requestParams = params;
            }
            if (!callback) {
                if (requestParams && (requestParams.cmd || requestParams.goformId)) {
                    var r = syncRequest(requestParams, isPost);
                    if (dealMethod) {
                        objectToReturn = $.extend({}, dealMethod(r));
                    }else{
                        objectToReturn = r;
                    }
                }
                // sleep(DelayOnEachCallMillis);
                return objectToReturn;
            } else {
                if (requestParams && (requestParams.cmd || requestParams.goformId)) {
                    asyncRequest(requestParams, function(data) {
                        if (dealMethod) {
                            objectToReturn = $.extend({}, dealMethod(data));
                        } else {
                            objectToReturn = $.extend({}, data);
                        }
                        //手动处理callback
                        if(!requestParams.notCallback){
                            doCallback(objectToReturn, callback, errorCallback);
                        }
                    }, function() {
                        if (errorObject) {
                            objectToReturn = $.extend(unknownErrorObject, errorObject);
                        } else {
                            objectToReturn = $.extend(unknownErrorObject, {
                                errorType : 'Unknown'
                            });
                        }
                        doCallback(objectToReturn, callback, errorCallback);
                    }, isPost);
                } else {
                    doCallback(objectToReturn, callback, errorCallback);
                }
            }
        }
        function doCallback(resultToReturn, callback, errorCallback) {
            errorCallback = errorCallback ? errorCallback : callback;
            if (isErrorObject(resultToReturn)) {
                switch (resultToReturn.errorType) {
                case 'cellularNetworkError':
                case 'deviceError':
                case 'wifiConnectionError':
                    wifiCallbackDestination.receivedNonSpecificError(resultToReturn);
                    break;
                default:
                    errorCallback(resultToReturn);
                }
            } else {
                callback(resultToReturn);
            }
        }
    }
    
    /**
     * 获取基本的wan信息
     * @method getWanBasic
     * @return {Object} wan JSON 对象 
     */
    function getWanBasic() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "wan_username,"+ "wan_customDns,wan_showpass,"+"wan_dns1,"+",wan_dns2,"+",wan_passPhrase,selectedConnectiontype";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {
                	wan_username: data.wan_username,
                	wan_showpass: data.wan_showpass,
                	wan_customDns:data.wan_customDns,
                    //passPhrase: config.PASSWORD_ENCODE ? Base64.decode(data.WPAPSK1_encode) : data.WPAPSK1,
                    //[yzy]read Wifi nv WPAPSK1 ,dont do Base64.decode
                	wan_passPhrase: data.wan_passPhrase,
                	wan_dns1:data.wan_dns1,
                	wan_dns2:data.wan_dns2,
                	selectedConnectiontype:data.selectedConnectiontype
                };
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置基本的WAN信息
     * @method setWanBasic
     * @param {Object} JSON 参数对象
     * @return {Object}
     */
    function setWanBasic() {
        doStuffAndCheckServerIsOnline(arguments, prepare, deal);

        function prepare(params) {
            var requestParams = {
                goformId : "SET_WAN_SETTINGS",
                isTest : isTest,
                wan_username : params.wan_username,
                wan_showpass: params.wan_showpass,
                wan_customDns:params.wan_customDns,
                //passPhrase: config.PASSWORD_ENCODE ? Base64.decode(data.WPAPSK1_encode) : data.WPAPSK1,
                //[yzy]read Wifi nv WPAPSK1 ,dont do Base64.decode
            	wan_passPhrase: params.wan_passPhrase,
            	wan_dns1:params.wan_dns1,
            	wan_dns2:params.wan_dns2,
            	connection_type:params.connection_type
            };
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取基本的wifi信息
     * @method getWifiBasic
     * @return {Object} wifi JSON 对象 
     */
    function getWifiBasic() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            var wpapsk = config.PASSWORD_ENCODE ? "WPAPSK1_encode,m_WPAPSK1_encode," : "WPAPSK1,m_WPAPSK1,";
            requestParams.cmd = "m_ssid_enable," + wpapsk + "MAX_Station_num,"+
                "SSID1,AuthMode,Key1Str1,wep_password_type,HideSSID,MAX_Access_num,selectedwaittime,EncrypType,showpass,lcd_showpass,flow_showss," +
                "m_SSID,m_AuthMode,m_HideSSID,m_MAX_Access_num,m_Waittime,m_EncrypType";

            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {
                    multi_ssid_enable: data.m_ssid_enable,
                    MAX_Station_num: $.isNumeric(data.MAX_Station_num) ? data.MAX_Station_num : config.MAX_STATION_NUMBER,
                    //ssid 1
                    AuthMode: data.AuthMode,
                    SSID: data.SSID1,
                    broadcast: data.HideSSID,
                    //passPhrase: config.PASSWORD_ENCODE ? Base64.decode(data.WPAPSK1_encode) : data.WPAPSK1,
                    //[yzy]read Wifi nv WPAPSK1 ,dont do Base64.decode
                    passPhrase: config.PASSWORD_ENCODE ? (data.WPAPSK1_encode) : data.WPAPSK1,
                    MAX_Access_num: data.MAX_Access_num,
                    selectedwaittime:data.selectedwaittime,
                    cipher: data.EncrypType == "TKIP" ? "0" : data.EncrypType == "AES" ? 1 : 2,
                    //ssid 2
                    m_SSID: data.m_SSID,
                    m_broadcast: data.m_HideSSID,
                    m_MAX_Access_num: data.m_MAX_Access_num,
                    m_Waittime:data.m_Waittime,
                    m_AuthMode: data.m_AuthMode,
                    //m_passPhrase: config.PASSWORD_ENCODE ? Base64.decode(data.m_WPAPSK1_encode) : data.m_WPAPSK1,
                    m_passPhrase: config.PASSWORD_ENCODE ? (data.m_WPAPSK1_encode) : data.m_WPAPSK1,
                    m_cipher: data.m_EncrypType == "TKIP" ? "0" : data.m_EncrypType == "AES" ? 1 : 2,
					wep_key_1:data.Key1Str1,
					wep_password_type:data.wep_password_type,
					showpass:data.showpass,
					lcd_showpass:data.lcd_showpass,
					flow_showss:data.flow_showss
                };
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置基本的wifi信息(SSID1)
     * @method setWifiBasic(SSID1)
     * @param {Object} JSON 参数对象
     * @return {Object}
     */
    function setWifiBasic() {
        doStuffAndCheckServerIsOnline(arguments, prepare, deal);

        function prepare(params) {
            var requestParams = {
                goformId : "SET_WIFI_SSID1_SETTINGS",
                isTest : isTest,
                ssid : params.SSID,
                broadcastSsidEnabled : params.broadcast,
                MAX_Access_num : params.station,
                security_mode: params.AuthMode,
				showpass:params.showpass,
				waittime:params.waittime,
				lcd_showpass:params.lcd_showpass,
				flow_showss:params.flow_showss,
                cipher: params.cipher
            };

            if(params.AuthMode == "WPAPSKWPA2PSK" || params.AuthMode == "WPA2PSK" ) {
                requestParams.security_shared_mode = params.cipher;
                requestParams.passphrase = config.PASSWORD_ENCODE ?Base64.encode(params.passPhrase): params.passPhrase;
            }
            else if(params.AuthMode == "SHARED") 
			{
                requestParams.security_shared_mode = "WEP";
				requestParams.Key1Str1 = config.PASSWORD_ENCODE ?Base64.encode(params.passPhrase): params.passPhrase;
				requestParams.wep_password_type = params.wep_password_type;
            }
            else {
                requestParams.security_shared_mode = "NONE";
            }

            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置基本的wifi信息(SSID2)
     * @method setWifiBasic(SSID2)
     * @param {Object} JSON 参数对象
     * @return {Object}
     */
    function setWifiBasic4SSID2() {
        doStuffAndCheckServerIsOnline(arguments, prepare, deal);

        function prepare(params) {
            var requestParams = {
                goformId : "SET_WIFI_SSID2_SETTINGS",
                isTest : isTest,
                m_SSID : params.m_SSID,
                m_HideSSID : params.m_broadcast,
                m_MAX_Access_num:params.m_station,
                //m_Waittime:params.m_Waittime,
                m_AuthMode: params.m_AuthMode,
                cipher: params.m_cipher
            };

            if(params.m_AuthMode == "WPAPSKWPA2PSK" || params.m_AuthMode == "WPA2PSK") {
                requestParams.m_EncrypType = params.m_cipher;
                requestParams.m_WPAPSK1 = config.PASSWORD_ENCODE ? Base64.encode(params.m_passPhrase) : params.m_passPhrase;
            }
            else {
                requestParams.m_EncrypType = "NONE";
            }

            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置基本的wifi信息
     * @method setWifiBasic
     * @param {Object} JSON 参数对象
     * @example
     * @return {Object}
     */
    function setWifiBasicMultiSSIDSwitch() {
        doStuffAndCheckServerIsOnline(arguments, prepare, deal);

        function prepare(params) {
            var requestParams = {
                goformId : "SET_WIFI_INFO",
                isTest : isTest,
                m_ssid_enable: params.multi_ssid_enable
            };
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }
    /**
     * 获取wifi安全设置信息
     * @method getSecurityInfo
     * @return {Object} wifi 安全 json 对象
     */
    function getSecurityInfo() {//not do
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "AuthMode,passPhrase";
            requestParams.multi_data = 1;
            return requestParams;
        }
        
        function deal(data) {
            if (data) {
                var result = {};
                result.AuthMode = data.AuthMode;
                result.passPhrase = config.PASSWORD_ENCODE ? Base64.decode(data.passPhrase) : data.passPhrase;
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }
    
    function setSecurityInfo() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "SET_WIFI_SECURITY_INFO";
            requestParams.AuthMode = params.AuthMode;
            if(requestParams.AuthMode == "WPAPSKWPA2PSK") {
                requestParams.passPhrase = config.PASSWORD_ENCODE ? Base64.encode(params.passPhrase) : params.passPhrase;
            }
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取当前已连接设备的信息
     * @method getCurrentlyAttachedDevicesInfo
     * @return {Object} JSON
     * @example
     //返回结构格式
     * {
     *  macAddress:"E8-E3-A5-AB-86-44",
     *  ipAddress:"192.168.0.45",
     *  hostName:"myhostName",
     *  timeConnected:00:00:10
     * }
     */
    function getCurrentlyAttachedDevicesInfo(){
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var obj = {
                isTest : isTest,
                cmd : "station_list"
            };
            return obj;
        }

        function deal(data) {
            var deviceArr = [];
            var attachedDevices = data.station_list;
            for(var i = 0; attachedDevices && i < attachedDevices.length; i++ ){
                var obj = {};
                obj.macAddress = attachedDevices[i].mac_addr;
				obj.ipAddress = attachedDevices[i].ip_addr;
				//obj.timeConnected = attachedDevices[i].conn_duration;//wenping del
                var hostname = attachedDevices[i].hostname;
                obj.hostName = hostname == "" ? $.i18n.prop("unknown") : hostname;
                deviceArr.push(obj);
            }
            return {attachedDevices: deviceArr};
        }
    }

    function getLanguage() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "Language";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.Language = (data && data.Language) ? data.Language : "en";
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    function setLanguage() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "SET_WEB_LANGUAGE";
            requestParams.Language = params.Language;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    function getNetSelectInfo() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "current_network_mode,m_netselect_save,net_select_mode,m_netselect_contents,net_select,net_priority,ppp_status,modem_main_state";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.current_network_mode = data.current_network_mode;
                result.net_select_mode = data.net_select_mode;
                result.m_netselect_save = data.m_netselect_save;
                result.m_netselect_contents = data.m_netselect_contents;
                result.net_select = data.net_select;
                result.net_priority = data.net_priority;
                result.ppp_status = data.ppp_status;
                result.modem_main_state = data.modem_main_state;
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    function setBearerPreference() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "SET_BEARER_PREFERENCE";
            requestParams.BearerPreference = params.strBearerPreference;
            return requestParams;
        }
        
        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    
    /**************************************************************************
     Description : scan the network
     Parameters :
     [IN] : function :callback(bResult, listNetwork) : call back function, and the parameters list below:
     [IN] : bool   : bResult     : true = succeed, false = failed.
     [IN] : object : listNetwork : network information array, the object attribute in the array below:
     type   :   name                   : description
     string : strFullName              : operator full name(the value is maybe ""),
     such as 'china mobile'
     string : strShortName             : operator short name(the value is maybe ""),
     such as 'china mobile'
     string : strNumeric               : the digital number, such as '460'
     number : nRat                     : the network connect technology, 0 = '2G', 2 = '3G'.
     number : nState : operator availability as int at+cops=? <stat> (This is as per 3GPP TS 27.007)
     if get net work list failed, the return value will be an null array.
     return : void
     @method scanForNetwork
     **************************************************************************/
    function scanForNetwork(callback) {
        if(isTest) {
            setTimeout(function() {parseScanResult(simulate.m_netselect_contents);}, 500);
            return;
        }

        $.post("/goform/goform_set_cmd_process", {
            goformId : "SCAN_NETWORK"
        }, function(data) {
            if (data.result == "success") {
                checkScanStatus();
            } else {
                callback(false, []);
            }
        }, "json").error(function() {
                callback(false, []);
        });

        //{"m_netselect_status":"manual_selected"}
        function checkScanStatus() {
            $.getJSON("/goform/goform_get_cmd_process", {
                cmd : "m_netselect_status",
                "_" : new Date().getTime()
            }, function(data) {
                if (data.m_netselect_status == "manual_selecting") {
                    setTimeout(checkScanStatus, 1000);
                } else {
                    $.getJSON("/goform/goform_get_cmd_process", {
                        cmd : "m_netselect_contents",
                        "_" : new Date().getTime()
                    }, function(data2) {
                        parseScanResult(data2.m_netselect_contents);
                    }).error(function(){
                            callback(false, []);
                        });
                }
            }).error(function() {
                    callback(false, []);
                });
        }

        function parseScanResult(result) {
            //var result= "2,China Mobile,46002,2;2,China Mobile,46002,3"
            var pattern = /([^,;]*),([^,]*),([^,]*),([^,;]*)/g;
            var listNetwork = [];
            var mts;
            while (mts = pattern.exec(result)) {
                if (mts != null) {
                    listNetwork.push({
                        //strFullName: mts[2].replace(/\"/g,''),
                        strShortName: mts[2].replace(/\"/g,''),
                        strNumeric: mts[3].replace(/\D/g,''),
                        nRat: parseInt(mts[4],10),
                        nState: parseInt(mts[1],10)
                    });
                }
            }
            callback(true, listNetwork);
        }
    }
    
    var timerInfo = {
        networkType : "",
        signalImg : "0",
        networkOperator : "",
        batteryLevel:"",
        rj45level:"",
        spn_display_flag : "1",
        plmn_display_flag : "1",
        spn_b1_flag : "1",
        spn_b2_flag : "1",
        spn_name_data : "",
        connectStatus : "ppp_disconnected",
        attachedDevices : [],
        curr_connected_devices : [],
        data_counter:{ 
            uploadRate : 0,
            downloadRate : 0,
            totalSent : 0,
            totalReceived : 0,
            totalConnectedTime : 0,
            currentSent : 0,
            currentReceived : 0,
            currentConnectedTime : 0,
            monthlySent: 0,
            monthlyReceived: 0,
            monthlyConnectedTime: 0,
            month : ''
        },
        newSmsReceived : false,
        smsReportReceived : false,
        smsUnreadCount : "0",
        isLoggedIn : undefined,
        limitVolumeEnable : false,
        limitVolumeType : '1',
        limitVolumePercent : "100",
        limitVolumeSize : "0",
        allowRoamingUpdate : "0",
        usbconnected:"1",//默认不显示,megaforn版本才要
        ap_station_enable: undefined
    };
    
    function getStatusInfo(){
        if (timerInfo.isLoggedIn === undefined) {
            var loginStatus = getLoginStatus();
            return {
                networkType:timerInfo.networkType,
                signalImg:timerInfo.signalImg,
                networkOperator:timerInfo.networkOperator,
                connectStatus:timerInfo.connectStatus,
                attachedDevices:timerInfo.curr_connected_devices,
                roamingStatus:timerInfo.roamingStatus,
                wifiStatus:timerInfo.wifiStatus,
                simStatus:timerInfo.simStatus,
                pinStatus:timerInfo.pinStatus,
                batteryStatus:timerInfo.batteryStatus,
                batteryLevel:timerInfo.batteryLevel,
                rj45level:timerInfo.rj45level,
                batteryPers:timerInfo.batteryPers,
                batteryTime:timerInfo.batteryTime,
                ssid:timerInfo.ssid,
                authMode:timerInfo.authMode,
                data_counter:timerInfo.data_counter,
                isLoggedIn:loginStatus.status == "loggedIn",
                newSmsReceived:timerInfo.newSmsReceived,
                smsReportReceived:timerInfo.smsReportReceived,
                smsUnreadCount:timerInfo.smsUnreadCount,
                limitVolumeEnable:timerInfo.limitVolumeEnable,
                limitVolumeType:timerInfo.limitVolumeType,
                limitVolumePercent:timerInfo.limitVolumePercent,
                limitVolumeSize:timerInfo.limitVolumeSize,
                connectWifiProfile:timerInfo.connectWifiProfile,
                connectWifiSSID:timerInfo.connectWifiSSID,
                connectWifiStatus:timerInfo.connectWifiStatus,
                multi_ssid_enable:timerInfo.multi_ssid_enable,
                spn_display_flag: timerInfo.spn_display_flag,
                plmn_display_flag: timerInfo.plmn_display_flag,
                spn_b1_flag: timerInfo.spn_b1_flag,
                spn_b2_flag: timerInfo.spn_b2_flag,
                spn_name_data: timerInfo.spn_name_data,
                roamMode: timerInfo.roamMode,
                current_upgrade_state: timerInfo.current_upgrade_state,
                is_mandatory: timerInfo.is_mandatory,
                new_version_state: timerInfo.new_version_state,
                allowRoamingUpdate: timerInfo.allowRoamingUpdate
            };
        }

        return {
            networkType : timerInfo.networkType,
            signalImg : timerInfo.signalImg,
            networkOperator : timerInfo.networkOperator,
            connectStatus : timerInfo.connectStatus,
            attachedDevices : timerInfo.curr_connected_devices,
            roamingStatus : timerInfo.roamingStatus,
            wifiStatus : timerInfo.wifiStatus,
            simStatus : timerInfo.simStatus,
            pinStatus : timerInfo.pinStatus,
            batteryStatus: timerInfo.batteryStatus,
            batteryLevel: timerInfo.batteryLevel,
            rj45level:timerInfo.rj45level,
            batteryPers: timerInfo.batteryPers,
            batteryTime :timerInfo.batteryTime,
            ssid : timerInfo.ssid,
            authMode: timerInfo.authMode,
            data_counter:timerInfo.data_counter,
            isLoggedIn:timerInfo.isLoggedIn,
            newSmsReceived : timerInfo.newSmsReceived,
            smsReportReceived : timerInfo.smsReportReceived,
            smsUnreadCount : timerInfo.smsUnreadCount,
            limitVolumeEnable : timerInfo.limitVolumeEnable,
            limitVolumeType : timerInfo.limitVolumeType,
            limitVolumePercent : timerInfo.limitVolumePercent,
            limitVolumeSize : timerInfo.limitVolumeSize,
            connectWifiProfile:timerInfo.connectWifiProfile,
            connectWifiSSID:timerInfo.connectWifiSSID,
            connectWifiStatus:timerInfo.connectWifiStatus,
            multi_ssid_enable:timerInfo.multi_ssid_enable,
            spn_display_flag: timerInfo.spn_display_flag,
            plmn_display_flag: timerInfo.plmn_display_flag,
            spn_b1_flag: timerInfo.spn_b1_flag,
            spn_b2_flag: timerInfo.spn_b2_flag,
            spn_name_data: timerInfo.spn_name_data,
            roamMode: timerInfo.roamMode,
            current_upgrade_state: timerInfo.current_upgrade_state,
            is_mandatory: timerInfo.is_mandatory,
            new_version_state: timerInfo.new_version_state,
            allowRoamingUpdate: timerInfo.allowRoamingUpdate,
            ap_station_enable: timerInfo.ap_station_enable
        };
    }    

    /**
     * 获取联网及流量信息
     * @method getConnectionInfo
     */
    function getConnectionInfo(){
        var isData = timerInfo.limitVolumeType == '1';
        var result = {
            data_counter : timerInfo.data_counter,
            connectStatus : timerInfo.connectStatus,
            limitVolumeEnable : timerInfo.limitVolumeEnable,
            limitVolumeType : timerInfo.limitVolumeType
        };
        if(isData){
            result.limitDataMonth = timerInfo.limitVolumeSize;
            result.limitTimeMonth = 0;
        } else {
            result.limitTimeMonth = timerInfo.limitVolumeSize;
            result.limitDataMonth = 0;
        }
        return result;
    }

    /**
     * 清除流量信息
     * @method clearTrafficData
     */
    function clearTrafficData(){
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "RESET_DATA_COUNTER";
            requestParams.option = "curr_total_month";
            return requestParams;
        }

        function deal(data) {
            if (data.result == "success") {
                return {
                    result : true
                };
            } else {
                return {
                    result : false
                };
            }
        }
    }
    
    /**
     * 将未读短信变量从接收到未读短信设置成没有接收到
     * @method resetNewSmsReceivedVar
     * @example
     * timerInfo.newSmsReceived = false;
     */
    function resetNewSmsReceivedVar(){
        timerInfo.newSmsReceived = false;
    }

    /**
     * 将短信发送报告变量从接收到设置成没有接收到
     * @method resetSmsReportReceivedVar
     * @example
     * timerInfo.smsReportReceived = false;
     */
    function resetSmsReportReceivedVar(){
        timerInfo.smsReportReceived = false;
    }
    
    /**
     * 获取短信容量。
     * @method getSmsCapability
     */
    function getSmsCapability(){
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "sms_capacity_info";
            return requestParams;
        }

        function deal(data) {
            return {
                nvTotal: parseInt(data.sms_nv_total,10),
                nvUsed: parseInt(data.sms_nv_rev_total,10) + parseInt(data.sms_nv_send_total,10) + parseInt(data.sms_nv_draftbox_total,10),
                simTotal: parseInt(data.sms_sim_total,10),
                simUsed: parseInt(data.sms_sim_rev_total,10) + parseInt(data.sms_sim_send_total,10) + parseInt(data.sms_sim_draftbox_total,10),
                nvReceive: parseInt(data.sms_nv_rev_total,10),
                nvSend: parseInt(data.sms_nv_send_total,10),
                nvDraft: parseInt(data.sms_nv_draftbox_total,10),
                simReceive: parseInt(data.sms_sim_rev_total,10),
                simSend: parseInt(data.sms_sim_send_total,10),
                simDraft: parseInt(data.sms_sim_draftbox_total,10)
            };
        }
    }
    
    /**
     * 联网
     * @method connect
     */
    function connect() {
        var callback = arguments[1];
        var checkPoint = 0;
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.notCallback = true;
            requestParams.goformId = "CONNECT_NETWORK";
            return requestParams;
        }

        function deal(data) {
            if (data.result == "success") {
                checkPoint = new Date().getTime();
                addCallback(checkConnectStatus);
            } else {
                callback({
                    result : false
                });
            }
        }

        function checkConnectStatus(data) {
            if (data.ppp_status == "ppp_connecting") {
                timerInfo.connectStatus = "ppp_connecting";
            } else if (checkConnectedStatus(data.ppp_status)) {
                removeCallback(checkConnectStatus);
                timerInfo.connectStatus = "ppp_connected";
                callback({
                    result : true,
                    status : timerInfo.connectStatus
                });
            } else if(new Date().getTime() - checkPoint < 1e4){
                timerInfo.connectStatus = "ppp_connecting";
            } else {
                removeCallback(checkConnectStatus);
                callback({
                    result : false
                });
            }
        }
    }

    /**
     * 断网
     * @method disconnect
     */
    function disconnect() {
        var callback = arguments[1];
        var checkPoint = 0;
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.notCallback = true;
            requestParams.goformId = "DISCONNECT_NETWORK";
            return requestParams;
        }

        function deal(data) {
            if (data.result == "success") {
                checkPoint = new Date().getTime();
                //addCallback(checkDisconnectStatus);
                setTimeout(function () {
                	//checkDisconnectStatus(data);
                	addCallback(checkDisconnectStatus);
                }, 3000 );
            } else {
                callback({
                    result : false
                });
            }
        }

        function checkDisconnectStatus(data) {
            if (data.ppp_status == "ppp_disconnecting") {
        	//if(timerInfo.connectStatus == "ppp_disconnecting"){
                timerInfo.connectStatus = "ppp_disconnecting";
            } else if (data.ppp_status == "ppp_disconnected") {
        	//}else if(checkDisconnectStatus(data.ppp_status)){
                removeCallback(checkDisconnectStatus);
                timerInfo.connectStatus = "ppp_disconnected";
                callback({
                    result : true,
                    status : timerInfo.connectStatus
                });
            } else {
                removeCallback(checkDisconnectStatus);
                callback({
                    result : false
                });
            }
        	/*removeCallback(checkDisconnectStatus);
            timerInfo.connectStatus = "ppp_disconnected";
            callback({
                result : true,
                status : timerInfo.connectStatus
            });*/
        }
    }

    /**
     * 获取apn信息
     * @method getApnSettings
     * @return {Object} JSON
     * @example
      //返回结果格式
        {
            APNs : result.APN_config0 + "||" + result.APN_config1 + "||" + result.APN_config2 + "||" + result.APN_config3 + "||" + result.APN_config4 + "||" + result.APN_config5 + "||" + result.APN_config6 + "||" + result.APN_config7 + "||" + result.APN_config8 + "||" + result.APN_config9,
            ipv6APNs : result.ipv6_APN_config0 + "||" + result.ipv6_APN_config1 + "||" + result.ipv6_APN_config2 + "||" + result.ipv6_APN_config3 + "||" + result.ipv6_APN_config4 + "||" + result.ipv6_APN_config5 + "||" + result.ipv6_APN_config6 + "||" + result.ipv6_APN_config7 + "||" + result.ipv6_APN_config8 + "||" + result.ipv6_APN_config9,
            apnMode : result.apn_select,
            profileName :  result.m_profile_name || result.profile_name,
            wanDial : result.wan_dial,
            apnSelect : result.apn_select,
            pdpType : result.pdp_type,
            pdpSelect : result.pdp_select,
            pdpAddr : result.pdp_addr,
            index : result.index,
            currIndex : result.Current_index,
            autoApns : result.apn_auto_config,
            wanApn : result.wan_apn,
            authMode : result.ppp_auth_mode,
            username : result.ppp_username,
            password : result.ppp_passwd,
            dnsMode : result.dns_mode,
            dns1 : result.prefer_dns_manual,
            dns2 : result.standby_dns_manual,
            wanApnV6 : result.ipv6_wan_apn,
            authModeV6 : result.ipv6_ppp_auth_mode,
            usernameV6 : result.ipv6_ppp_username,
            passwordV6 : result.ipv6_ppp_passwd,
            dnsModeV6 : result.ipv6_dns_mode,
            dns1V6 : result.ipv6_prefer_dns_manual,
            dns2V6 : result.ipv6_standby_dns_manual
        }
     * 
     */
    function getApnSettings() {
        
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            /*requestParams.cmd = "APN_config0,APN_config1,APN_config2,APN_config3,APN_config4,APN_config5,APN_config6,APN_config7,APN_config8,APN_config9," +
                                "APN_config10,APN_config11,APN_config12,APN_config13,APN_config14,APN_config15,APN_config16,APN_config17,APN_config18,APN_config19," +
                                "ipv6_APN_config0,ipv6_APN_config1,ipv6_APN_config2,ipv6_APN_config3,ipv6_APN_config4,ipv6_APN_config5,ipv6_APN_config6,ipv6_APN_config7,ipv6_APN_config8,ipv6_APN_config9," +
                                "ipv6_APN_config10,ipv6_APN_config11,ipv6_APN_config12,ipv6_APN_config13,ipv6_APN_config14,ipv6_APN_config15,ipv6_APN_config16,ipv6_APN_config17,ipv6_APN_config18,ipv6_APN_config19," +
                                "m_profile_name,profile_name,wan_dial,apn_select,pdp_type,pdp_select,pdp_addr,wan_dial_2,apn_select_2,pdp_type_2,pdp_select_2,pdp_addr_2,index,Current_index,apn_auto_config,ipv6_apn_auto_config," +
                                "apn_mode,wan_apn,ppp_auth_mode,ppp_username,ppp_passwd,dns_mode,prefer_dns_manual,standby_dns_manual,wan_apn_2,ppp_auth_mode_2,ppp_username_2,ppp_passwd_2,dns_mode_2,prefer_dns_manual_2,standby_dns_manual_2," +
                                "ipv6_wan_apn,ipv6_pdp_type,ipv6_ppp_auth_mode,ipv6_ppp_username,ipv6_ppp_passwd,ipv6_dns_mode,ipv6_prefer_dns_manual,ipv6_standby_dns_manual,cpuinfo";*/
            requestParams.cmd = "APN_config0,APN_config1,APN_config2,APN_config3,APN_config4,APN_config5,APN_config6,APN_config7,APN_config8,APN_config9," +
					            "APN_config10,APN_config11,APN_config12,APN_config13,APN_config14,APN_config15,APN_config16,APN_config17,APN_config18,APN_config19," +
					            /*"ipv6_APN_config0,ipv6_APN_config1,ipv6_APN_config2,ipv6_APN_config3,ipv6_APN_config4,ipv6_APN_config5,ipv6_APN_config6,ipv6_APN_config7,ipv6_APN_config8,ipv6_APN_config9," +
					            "ipv6_APN_config10," +*/
					            "m_profile_name,profile_name,wan_dial,apn_select,pdp_type,pdp_select,pdp_addr,wan_dial_2,apn_select_2,pdp_type_2,pdp_select_2,pdp_addr_2,index,Current_index,apn_auto_config,ipv6_apn_auto_config," +
					            "apn_mode,wan_apn,ppp_auth_mode,ppp_username,ppp_passwd,dns_mode,prefer_dns_manual,standby_dns_manual,wan_apn_2,ppp_auth_mode_2,ppp_username_2,ppp_passwd_2,dns_mode_2,prefer_dns_manual_2,standby_dns_manual_2," +
					            "ipv6_wan_apn,ipv6_pdp_type,ipv6_ppp_auth_mode,ipv6_ppp_username,ipv6_ppp_passwd,ipv6_dns_mode,ipv6_prefer_dns_manual,ipv6_standby_dns_manual,mnc,mcc,mnctemp,mcctemp,cpuinfo";
            requestParams.multi_data = 1;
            return requestParams;
        }

        //_apnConfig = "China Mobile($)cmnet($)manual($)*99#($)none($)($)($)IP($)auto($)($)auto($)($)China Mobile($)cmnet($)manual($)*99#($)none($)($)($)IP($)auto($)($)auto($)($)";
        function deal(result) {
            if (result) {
                return {
                    /*APNs : result.APN_config0 + "||" + result.APN_config1 + "||" + result.APN_config2 + "||" + result.APN_config3 + "||" + result.APN_config4 + "||" 
                            + result.APN_config5 + "||" + result.APN_config6 + "||" + result.APN_config7 + "||" + result.APN_config8 + "||" + result.APN_config9 + "||"
                            + result.APN_config10 + "||" + result.APN_config11 + "||" + result.APN_config12 + "||" + result.APN_config13 + "||" + result.APN_config14 + "||" 
                            + result.APN_config15 + "||" + result.APN_config16 + "||" + result.APN_config17 + "||" + result.APN_config18 + "||" + result.APN_config19,
                    ipv6APNs : result.ipv6_APN_config0 + "||" + result.ipv6_APN_config1 + "||" + result.ipv6_APN_config2 + "||" + result.ipv6_APN_config3 + "||" + result.ipv6_APN_config4 + "||" 
                            + result.ipv6_APN_config5 + "||" + result.ipv6_APN_config6 + "||" + result.ipv6_APN_config7 + "||" + result.ipv6_APN_config8 + "||" + result.ipv6_APN_config9 + "||" 
                            + result.ipv6_APN_config10 + "||" + result.ipv6_APN_config11 + "||" + result.ipv6_APN_config12 + "||" + result.ipv6_APN_config13 + "||" + result.ipv6_APN_config14 + "||" 
                            + result.ipv6_APN_config15 + "||" + result.ipv6_APN_config16 + "||" + result.ipv6_APN_config17 + "||" + result.ipv6_APN_config18 + "||" + result.ipv6_APN_config19,*/
                	APNs : result.APN_config0 + "||" + result.APN_config1 + "||" + result.APN_config2 + "||" + result.APN_config3 + "||" + result.APN_config4 + "||" 
		                    + result.APN_config5 + "||" + result.APN_config6 + "||" + result.APN_config7 + "||" + result.APN_config8 + "||" + result.APN_config9 + "||"
		                    + result.APN_config10 + "||"  + result.APN_config11 + "||" + result.APN_config12 + "||" + result.APN_config13 + "||" + result.APN_config14 + "||" 
                            + result.APN_config15 + "||" + result.APN_config16 + "||" + result.APN_config17 + "||" + result.APN_config18 + "||" + result.APN_config19,
                    /*ipv6APNs : result.ipv6_APN_config0 + "||" + result.ipv6_APN_config1 + "||" + result.ipv6_APN_config2 + "||" + result.ipv6_APN_config3 + "||" + result.ipv6_APN_config4 + "||" 
			                    + result.ipv6_APN_config5 + "||" + result.ipv6_APN_config6 + "||" + result.ipv6_APN_config7 + "||" + result.ipv6_APN_config8 + "||" + result.ipv6_APN_config9 + "||" 
			                    + result.ipv6_APN_config10,*/
                    apnMode : result.apn_mode,
                    profileName :  result.m_profile_name || result.profile_name,
                    wanDial : result.wan_dial,
                    apnSelect : result.apn_select,
                    pdpType : result.pdp_type /*== 'IP' ? 'IP' : result.ipv6_pdp_type*/,
                    pdpSelect : result.pdp_select,
                    pdpAddr : result.pdp_addr,
                    index : result.index,
                    currIndex : result.Current_index,
                    autoApns : result.apn_auto_config,
                    autoApnsV6 : result.ipv6_apn_auto_config,
                    wanApn : result.wan_apn,
                    authMode : result.ppp_auth_mode.toLowerCase(),
                    username : result.ppp_username,
                    password : result.ppp_passwd,
                    dnsMode : result.dns_mode,
                    dns1 : result.prefer_dns_manual,
                    dns2 : result.standby_dns_manual,
				    wanDial2 : result.wan_dial_2,
                    apnSelect2 : result.apn_select_2,
                    pdpType2 : result.pdp_type_2 == 'IP' ? 'IP' : result.ipv6_pdp_type,
                    pdpSelect2 : result.pdp_select_2,
                    pdpAddr2 : result.pdp_addr_2,
                    wanApn2 : result.wan_apn_2,
                    authMode2 : result.ppp_auth_mode_2.toLowerCase(),
                    username2 : result.ppp_username_2,
                    password2 : result.ppp_passwd_2,
                    dnsMode2 : result.dns_mode_2,
                    prefer_dns2 : result.prefer_dns_manual_2,
                    standby_dns2 : result.standby_dns_manual_2,
                    wanApnV6 : result.ipv6_wan_apn,
                    authModeV6 : result.ipv6_ppp_auth_mode.toLowerCase(),
                    usernameV6 : result.ipv6_ppp_username,
                    passwordV6 : result.ipv6_ppp_passwd,
                    dnsModeV6 : result.ipv6_dns_mode,
                    dns1V6 : result.ipv6_prefer_dns_manual,
                    dns2V6 : result.ipv6_standby_dns_manual,
                    mnc:result.mnc,
                    mcc:result.mcc,
                    mnctemp:result.mnctemp,
                    mcctemp:result.mcctemp,
					cpuinfo : result.cpuinfo
                };
            } else {
                return {
                    result : false
                };
            }
        }
    }

    /**
     * 根据profile name删除apn信息
     * @method deleteApn
     * @return {Object} JSON resultObject
     * @example
      //请求参数映射
        {
            goformId : "APN_PROC_EX",
            apn_action : "delete",
            apn_mode : "manual",
            index : params.index
        }
     */
    function deleteApn(){
        return doStuff(arguments, {}, prepare, deal, null, true);
        
        function prepare(params, isPost) {
            var requestParams = {
                isTest : isTest,
                apn_action : "delete",
                apn_mode : "manual",
                index : params.index
            };
            if(config.USE_IPV6_INTERFACE){
                requestParams.goformId = "APN_PROC_EX";
            } else {
                requestParams.goformId = "APN_PROC";
            }
            return requestParams;
        }

        function deal(data) {
            if (data.result == "success") {
                return {
                    result : true
                };
            } else {
                return {
                    result : false
                };
            }
        }
    }

    /**
     * 设置默认APN
     * @method setDefaultApn
     * @return {Object} JSON resultObject
     * @example
      //请求参数映射
        {
            goformId : "APN_PROC_EX", //"APN_PROC",
            apn_action : "set_default",
            //0(新增并且设置默认，或者编辑后设置默认)/1（选择已经保存过的，直接设置默认）
            //目前只支持1。当传0时，需要将save时的参数一并传下
            set_default_flag : "1",
            pdp_type : params.pdpType, //IP/IPv6/IPv4v6
            index : params.index,
            apn_mode : 'manual' 
        }
     */
    function setDefaultApn(){
        return doStuff(arguments, {}, prepare, deal, null, true);
        
        function prepare(params, isPost) {
            if(config.USE_IPV6_INTERFACE){
                var requestParam = {
                        isTest : isTest,
                        goformId : "APN_PROC_EX", //"APN_PROC",
                        apn_mode : params.apnMode 
                };
                if(params.apnMode == 'manual'){
                    requestParam.apn_action = "set_default";
                    //0(新增并且设置默认，或者编辑后设置默认)/1（选择已经保存过的，直接设置默认）
                    //目前只支持1。当传0时，需要将save时的参数一并传下
                    requestParam.set_default_flag = "1";
                    requestParam.pdp_type = params.pdpType; //IP/IPv6/IPv4v6
                    requestParam.index = params.index;
                    
                }
                return requestParam;
            }else{
                return {
                    isTest : isTest,
                    goformId : "APN_PROC", //"APN_PROC",
                    apn_action : "set_default",
                    index : params.index,
                    apn_mode : params.apnMode,// == "auto" ? "auto_dial" : "manual_dial",
                    profile_name : params.profileName,
                    wan_apn : params.wanApn,
                    dns_mode : params.dnsMode,
                    connect_mode:params.connectMode,
                    mnc:params.mnc,
                    mcc:params.mcc,
                    prefer_dns_manual : params.dns1,
                    w_standby_dns_manual : params.dns2,
                    ppp_username : params.username,
                    ppp_passwd : params.password,
                    ppp_auth_mode : params.authMode,
                    apn_select : 'manual',
                    wan_dial : '*99#',
                    pdp_type: 'PPP',
                    pdp_select: 'auto',
                    pdp_addr: '',
                    set_default_flag : '1'
                };
            }
        }

        function deal(data) {
            if (data.result == "success") {
                return {
                    result : true
                };
            } else {
                return {
                    result : false
                };
            }
        }
    }

    /**
     * 新增APN
     * @method addOrEditApn
     * @return {Object} JSON resultObject
     */
    function addOrEditApn(){
        return doStuff(arguments, {}, prepare, deal, null, true);
        
        function prepare(params, isPost) {
            if(config.USE_IPV6_INTERFACE){
                var requestParams = {
                        isTest : isTest,
                        goformId : "APN_PROC_EX",
                        apn_action : "save",
                        apn_mode : "manual",
                        profile_name : params.profileName,
                        wan_dial : '*99#',
                        apn_select : 'manual',
                        pdp_type: params.pdpType,//IP/IPv6/IPv4v6
                        pdp_select: 'auto',
                        pdp_addr: '',
                        index : params.index
                };
                if(params.pdpType == "IP"){
                    $.extend(requestParams, {
                        wan_apn : params.wanApn,
                        ppp_auth_mode : params.authMode,
                        ppp_username : params.username,
                        ppp_passwd : params.password,
                        dns_mode : params.dnsMode,
                        prefer_dns_manual : params.dns1,
                        standby_dns_manual : params.dns2,
						/*3gpp2 part*/
						wan_apn_2 :  params.wanApn2,
				        ppp_auth_mode_2 : params.authMode2,
				        ppp_username_2 : params.username2,
				        ppp_passwd_2 : params.password2,
						/*3gpp2 part*/
                    });
                }else if(params.pdpType == "IPv6"){
                    $.extend(requestParams, {
                        ipv6_wan_apn : params.wanApnV6,
                        ipv6_ppp_auth_mode : params.authModeV6,
                        ipv6_ppp_username : params.usernameV6,
                        ipv6_ppp_passwd : params.passwordV6,
                        ipv6_dns_mode : params.dnsModeV6,
                        ipv6_prefer_dns_manual : params.dns1V6,
                        ipv6_standby_dns_manual : params.dns2V6
                    });
                }else{//"IPv4v6"
                    $.extend(requestParams, {
                        wan_apn : params.wanApn,
                        ppp_auth_mode : params.authMode,
                        ppp_username : params.username,
                        ppp_passwd : params.password,
                        dns_mode : params.dnsMode,
                        prefer_dns_manual : params.dns1,
                        standby_dns_manual : params.dns2,
						/*3gpp2 part*/
						wan_apn_2 :  params.wanApn2,
				        ppp_auth_mode_2 : params.authMode2,
				        ppp_username_2 : params.username2,
				        ppp_passwd_2 : params.password2,
						/*3gpp2 part*/
                        ipv6_wan_apn : params.wanApnV6,
                        ipv6_ppp_auth_mode : params.authModeV6,
                        ipv6_ppp_username : params.usernameV6,
                        ipv6_ppp_passwd : params.passwordV6,
                        ipv6_dns_mode : params.dnsModeV6,
                        ipv6_prefer_dns_manual : params.dns1V6,
                        ipv6_standby_dns_manual : params.dns2V6
                    });
                }
                return requestParams;
            }else{
                var requestParams = {
                    isTest : isTest,
                    goformId : "APN_PROC",
                    apn_action : "save",
                    apn_mode : 'manual',
                    index : params.index,
                    profile_name : params.profileName,
                    wan_apn : params.wanApn,
                    dns_mode : params.dnsMode,
                    connect_mode:params.connectMode,
                    prefer_dns_manual : params.dns1,
                    w_standby_dns_manual : params.dns2,
                    ppp_auth_mode : params.authMode,
                    ppp_username : params.username,
                    ppp_passwd : params.password,
                    mnc:params.mnc,
                    mcc:params.mcc,
					/*3gpp2 part*/
					wan_apn_2 :  params.wanApn2,
				    ppp_auth_mode_2 : params.authMode2,
				    ppp_username_2 : params.username2,
				    ppp_passwd_2 : params.password2,
					/*3gpp2 part*/
                    wan_dial : '*99#',
                    apn_select : 'manual',
                    pdp_type: 'PPP',
                    pdp_select: 'auto',
                    pdp_addr: ''
                };
                return requestParams;
            }
        }

        function deal(data) {
            if (data.result == "success") {
                return {
                    result : true
                };
            } else {
                return {
                    result : false
                };
            }
        }
    }
    
    /**
     * 定时刷新获取的参数列表
     * @attribute {Array} timerQueryString 
     */
    var timerQueryString = [ "modem_main_state", "pin_status","loginfo","new_version_state","current_upgrade_state","is_mandatory"];
    var loginTimerQueryString = ["sms_received_flag", "sts_received_flag", "signalbar","network_type", "network_provider",
        "ppp_status","EX_SSID1","sta_ip_status","EX_wifi_profile","m_ssid_enable", 'sms_unread_num', "rj45level","RadioOff",
        "simcard_roam", "lan_ipaddr","station_mac", "battery_charging", "battery_vol_percent","battery_pers","spn_display_flag","plmn_display_flag","spn_name_data","spn_b1_flag","spn_b2_flag",
        "realtime_tx_bytes","realtime_rx_bytes","realtime_time","realtime_tx_thrpt","realtime_rx_thrpt",
        "monthly_rx_bytes","monthly_tx_bytes","monthly_time","date_month","data_volume_limit_switch",
    "data_volume_limit_size","usbconnected","data_volume_alert_percent","data_volume_limit_unit","roam_setting_option","upg_roam_switch"];

    /**
     * 定时刷新临时回调列表
     * @attribute {Array} timerCallbackStack 
     */
    var timerCallbackStack = [];

    /**
     * 定时刷新回调列表
     * @attribute {Array} timerCallbacks 
     */
    var timerCallbacks = [ timerUpdateStatus ];

    /**
     * 定时刷新器。成功获取到数据以后将遍历回调列表
     * @method timerUpdater 
     */
    function timerUpdater() {
        if (!timerUpdaterEnable) return;
        var queryParams = checkTimerUpdaterParameters();
        asyncRequest(queryParams, function (data) {
            for (var i = 0; i < timerCallbacks.length; i++) {
                if (typeof timerCallbacks[i] === "function") {
                    timerCallbacks[i](data);
                }
            }
            $.merge(timerCallbacks, timerCallbackStack);
            timerCallbackStack = [];
            //setTimeout(function(){timerUpdater();}, 1000);
            setTimeout(function(){timerUpdater();}, 2000);
        }, function () {
            timerUpdaterErrorCallback();
            //setTimeout(function(){timerUpdater();}, 1000);
            setTimeout(function(){timerUpdater();}, 2000);
        }, false);
    }

    /**
     * 检查定时器参数，在未登录前不进行瞬时状态查询
     * @method checkTimerUpdaterParameters
     */
    function checkTimerUpdaterParameters() {
        var queryParams = {
            multi_data:1,
            isTest:isTest
        };
        if (window.location.hash && window.location.hash != '#login' && timerInfo.isLoggedIn) {
            queryParams.sms_received_flag_flag = 0;
            queryParams.sts_received_flag_flag = 0;
            if (loginTimerQueryString.length > 0 && _.indexOf(timerQueryString, loginTimerQueryString[0]) == -1) {
                $.each(loginTimerQueryString, function(i, n){
                    timerQueryString.push(n);
                });
            }
        } else {
            if (loginTimerQueryString.length > 0 && _.indexOf(timerQueryString, loginTimerQueryString[0]) != -1) {
                timerQueryString = _.without(timerQueryString, loginTimerQueryString);
            }
        }
        queryParams.cmd = timerQueryString.join(",");
        return queryParams;
    }

    /**
     * 增加定时刷新参数及回调
     * @method addTimerThings
     * @param {Array || String} querys 查询key
     * @param {Function} cb callback
     */
    function addTimerThings(querys, cb) {
        if (_.isArray(querys)) {
            for ( var i = 0; i < querys.length; i++) {
                addQueryString(querys[i]);
            }
        } else {
            addQueryString(querys);
        }
        addCallback(cb);
    }

    /**
     * 删除定时刷新参数及回调
     * @method removeTimerThings
     * @param {Array || String} querys 查询key
     * @param {Function} cb
     */
    function removeTimerThings(querys, cb) {
        if (_.isArray(querys)) {
            for ( var i = 0; i < querys.length; i++) {
                removeQueryString(querys[i]);
            }
        } else {
            removeQueryString(querys);
        }
        removeCallback(cb);
    }

    /**
     * 增加定时刷新回调
     * @method addCallback
     * @param {Function} cb
     */
    function addCallback(cb) {
        if (_.indexOf(timerCallbackStack, cb) == -1) {
            timerCallbackStack.push(cb);
        }
    }

    /**
     * 删除定时刷新回调
     * @method removeCallback
     * @param {Function} cb
     */
    function removeCallback(cb) {
        timerCallbacks = _.without(timerCallbacks, cb);
        if(timerCallbacks.length == 0){
            timerCallbacks.push(timerUpdateStatus);
        }
        return timerCallbackStack;
    }

    /**
     * 增加定时刷新参数
     * @method addQueryString
     * @param {String} query 查询key
     */
    function addQueryString(query) {
        if (_.indexOf(timerQueryString, query) == -1) {
            timerQueryString.push(query);
        }
    }

    /**
     * 删除定时刷新回调
     * @method removeQueryString
     * @param {String} query
     */
    function removeQueryString(query) {
        timerQueryString = _.without(timerQueryString, query);
        return timerQueryString;
    }
    
    /**
     * 定时刷新默认状态更新回调函数
     * @method timerUpdateStatus
     * @param {Object} JSON data 定时刷新返回的结果集
     */
    function timerUpdateStatus(data) {
        timerInfo.signalImg = typeof data.signalbar == 'undefined' ? '0' : data.signalbar;
        timerInfo.networkType = data.network_type ? data.network_type : '';
        if (timerInfo.networkType.toLowerCase().indexOf("limited_service") != -1) {
            timerInfo.networkType = "limited_service";
        }
        timerInfo.networkOperator = data.network_provider ? data.network_provider : '';
        timerInfo.connectStatus = typeof data.ppp_status == 'undefined' ? 'ppp_disconnected' : data.ppp_status;
        timerInfo.spn_display_flag = data.spn_display_flag;
        timerInfo.plmn_display_flag = data.plmn_display_flag;
        timerInfo.spn_b1_flag = data.spn_b1_flag;
        timerInfo.spn_b2_flag = data.spn_b2_flag;
        timerInfo.spn_name_data = data.spn_name_data;
        var curr_connected_devices = (!data.station_mac || data.station_mac == "") ? [] : data.station_mac.split(";");
//        for (var i = 0; i < curr_connected_devices.length; i++) {
//            var hostName = data.curr_connected_devices[i].hostName;
//            if (hostName == "") {
//                data.curr_connected_devices[i].hostName = data.curr_connected_devices[i].macAddress;
//            }
//            var timeConnected = data.curr_connected_devices[i].timeConnected;
//            if (timeConnected == "") {
//                data.curr_connected_devices[i].timeConnected = 0;
//            }
//        }
        timerInfo.curr_connected_devices = curr_connected_devices;
        timerInfo.roamingStatus = getRoamStatus(timerInfo.networkType, data.modem_main_state, data.simcard_roam);
        timerInfo.wifiStatus = data.RadioOff == "1";
        timerInfo.simStatus = data.modem_main_state;
        timerInfo.pinStatus = data.pin_status;
        //TODO 电池续航时间需要再讨论
        var needMinutes = 3 * 60 * 60;
        var batteryLevel = (data.battery_vol_percent && data.battery_vol_percent.length > 0) ? data.battery_vol_percent : 100;
        timerInfo.batteryPers = data.battery_pers;
        var remainMinutes = Math.round(needMinutes * (1 - batteryLevel / 100));
        timerInfo.batteryStatus = (typeof data.battery_charging == 'undefined') ? '0' : data.battery_charging;
        timerInfo.batteryLevel = batteryLevel+'%';
        timerInfo.rj45level = data.rj45level;
        timerInfo.batteryTime = remainMinutes.toString();
        timerInfo.usbconnected = data.usbconnected;//20190815
        if(timerInfo.usbconnected == '0'){
        	//$("#usb-bubble").show();
        	$("#usb-bubble").hide();//默认不显示,megaforn版本才要
        }else{
        	$("#usb-bubble").hide();
        }
        timerInfo.data_counter = {
            uploadRate: data.realtime_tx_thrpt == '' ? 0 : data.realtime_tx_thrpt,
            downloadRate: data.realtime_rx_thrpt == '' ? 0 : data.realtime_rx_thrpt,
            /*totalSent : data.total_tx_bytes == '' ? 0 : data.total_tx_bytes,
             totalReceived : data.total_rx_bytes == '' ? 0 : data.total_rx_bytes,
             totalConnectedTime : data.total_time == '' ? 0 : data.total_time,*/
            currentSent: data.realtime_tx_bytes == '' ? 0 : data.realtime_tx_bytes,
            currentReceived: data.realtime_rx_bytes == '' ? 0 : data.realtime_rx_bytes,
            currentConnectedTime: data.realtime_time == '' ? 0 : data.realtime_time,
            monthlySent: data.monthly_tx_bytes == '' ? 0 : data.monthly_tx_bytes,
            monthlyReceived: data.monthly_rx_bytes == '' ? 0 : data.monthly_rx_bytes,
            monthlyConnectedTime: data.monthly_time == '' ? 0 : data.monthly_time,
            month: data.date_month == '' ? 1 : data.date_month
        };
        timerInfo.ssid = data.SSID1;
        timerInfo.authMode = data.AuthMode;
        timerInfo.isLoggedIn = config.HAS_LOGIN ? data.loginfo == "ok" : true;
        if (!timerInfo.newSmsReceived) {
            timerInfo.newSmsReceived = data.sms_received_flag > 0;
        }
        if (!timerInfo.smsReportReceived) {
            timerInfo.smsReportReceived = !!data.sts_received_flag;
        }
        if (typeof data.sms_dev_unread_num != "undefined") {
            timerInfo.smsUnreadCount = config.SMS_UNREAD_NUM_INCLUDE_SIM ? parseInt(data.sms_dev_unread_num | 0, 10) + parseInt(data.sms_sim_unread_num | 0, 10) : parseInt(data.sms_dev_unread_num | 0, 10);
        } else {
            timerInfo.smsUnreadCount = parseInt(data.sms_unread_num | 0, 10)
        }
        if (data.data_volume_limit_switch == '1') {
            timerInfo.limitVolumeEnable = true;
            timerInfo.limitVolumeType = data.data_volume_limit_unit == 'data' ? '1' : '0';
            timerInfo.limitVolumePercent = data.data_volume_alert_percent;
            if (data.data_volume_limit_unit == 'data') {
                var dataMonthLimit = data.data_volume_limit_size.split("_");
                timerInfo.limitVolumeSize = dataMonthLimit[0] * dataMonthLimit[1] * 1024 * 1024;
            } else {
                timerInfo.limitVolumeSize = data.data_volume_limit_size * 60 * 60;
            }
        } else {
            timerInfo.limitVolumeEnable = false;
            timerInfo.limitVolumeType = '1';
            timerInfo.limitVolumePercent = '100';
            timerInfo.limitVolumeSize = '0';
        }
        timerInfo.connectWifiProfile = data.EX_wifi_profile;
        timerInfo.connectWifiSSID = data.EX_SSID1;
        timerInfo.connectWifiStatus = data.sta_ip_status;
        timerInfo.multi_ssid_enable = data.m_ssid_enable;
        timerInfo.roamMode = data.roam_setting_option;
        // TODO OTA
        timerInfo.new_version_state = data.new_version_state == '1' || data.new_version_state == "version_has_new_critical_software" || data.new_version_state == "version_has_new_optional_software" || data.current_upgrade_state == 'upgrade_pack_redownload';
        timerInfo.current_upgrade_state = data.current_upgrade_state;
        if (timerInfo.current_upgrade_state == "downloading") {
            timerInfo.current_upgrade_state = "upgrading";
        } else if (timerInfo.current_upgrade_state == "verify_failed") {
            timerInfo.current_upgrade_state = "upgrade_pack_error";
        }
        // TODO OTA
        timerInfo.is_mandatory = data.is_mandatory == "1" || data.new_version_state == "version_has_new_critical_software";
        timerInfo.allowRoamingUpdate = data.upg_roam_switch;
    }

    function timerUpdaterErrorCallback(){
        timerInfo.batteryStatus = '0';
    }
    /**
     * 获取漫游状态, 参考MF93
     * @method getRoamStatus
     */
    function getRoamStatus(networkType, modemState, simcardRoam) {
        if(("" == $.trim(networkType)) || "no_service" == networkType.toLowerCase() || "limited_service" == networkType.toLowerCase() || "modem_sim_undetected" == modemState ||"modem_waitpin" == modemState || "modem_waitpuk" == modemState){
            return false;
        }

        if ("Internal" == simcardRoam || "International" == simcardRoam){
            return true;
        }else{
            return false;
        }
    }


    $(document).ready(function() {
        setTimeout(function () {
            timerUpdater();
        }, config.IS_TEST ? 2000 : 0);
    });
    
    /**************************************************************************
     Description : set current network
     Parameters :
     [IN] : string   : strNetworkNumber : the network digital number MCCMNC.
     [IN] : number   : nRat : the network connect technology: 0 = "2G", 2 = "3G".
     [IN] : function : callback(bResult) : call back function, and the parameters list below:
     [IN] : bool : bResult : true = succeed, false = failed.
     return : bool : if the parameters is invalid, the function will return false, otherwise will return true.
     comment: we need another parameter nRat, the value may be: 0 = '2G' or 2 = '3G'.
     @method setNetwork
     **************************************************************************/
    function setNetwork(strNetworkNumber, nRat, callback) {
        if(isTest) {
            setTimeout(function() {callback(true);}, 500);
            return;
        }

        if((typeof(strNetworkNumber) !== "string") || (strNetworkNumber === "") ||
            (typeof(nRat) !== "number") || (isNaN(nRat))) {
            if(typeof(callback) === "function") {
                callback(false);//VDF null
                return;
            }
        }
        var nRat1 = -1;
        if(nRat === 0) {
            nRat1 = 0;
        } else if(nRat === 2) {
            nRat1 = 2;
        } else if(nRat == 7) {
            nRat1 = 7;
        } else {
            nRat1 = -1;
        }
        if(-1 === nRat1) {
            if(typeof(callback) === "function") {
                callback(false);//VDF null
                return;
            }
        }
        var vNetwork = {};
        postData({
            goformId: "SET_NETWORK",
            NetworkNumber: strNetworkNumber,
            Rat: nRat
        },function(result){
            if(result){
                var flag;
                var counter = 0;
                var timer = setInterval(function(){
                    var obj = syncRequestForNetwork('m_netselect_result');//("manual_netsel_flag");
                    if(!obj){
                        callback(false);
                    }
                    //after 60s,if the flag is empty,it means that setNetwork fail
                    if(obj.m_netselect_result == "manual_success"){
                        flag = "1";
                        window.clearInterval(timer);
                        callback(true);
                    } else if(obj.m_netselect_result == "manual_fail"){
                        flag = "0";
                        window.clearInterval(timer);
                        callback(false);
                    }else if(counter < 120){
                        counter++;
                    }else{
                        window.clearInterval(timer);
                        callback(false);
                    }
                },1000);
            }else{
                callback(false);
            }
        });

        function syncRequestForNetwork(params) {
            var result;
            $.ajax({
                url : "/goform/goform_get_cmd_process",
                data : {
                    cmd : params
                },
                dataType : "json",
                async : false,
                cache : false,
                error : function() {
                    result = null;
                },
                success : function(data) {
                    result = data;
                }
            });
            return result;
        }

        function postData(params, callback) {
            params._= new Date().getTime();
            $.post("/goform/goform_set_cmd_process", params, function(data){
                if(typeof callback == "function") {
                    if(data.result == "success") {
                        callback(true);
                    }
                    else {
                        callback(false);
                    }
                }
            }, "json")
                .error(function(){
                    if(typeof callback == "function") {
                        callback(false);
                    }
                });
        }
    }
    
    /**************************************************************************
     Description : get current network information
     Parameters :
     [IN] : function :callback(bResult, vNetwork) : call back function, and the parameters list below:
     [IN] : bool   : bResult     : true = succeed, false = failed.
     [IN] : object : vNetwork : network information object, the object attribute list below:
     type   :   name       : description
     string : strFullName  : operator full name(the value is maybe ""),
     such as 'china mobile'
     string : strShortName : operator short name(the value is maybe ""),
     such as 'china mobile'
     string : strNumeric   : the digital number, such as '460'
     number : nRat         : the network connect technology, 0 = '2G', 2 = '3G'.
     string : strBearer   : the current bearer, maybe one of:
        <empty>
        GSM
        GPRS
        EDGE
        WCDMA
        HSDPA
        HSUPA
        HSPA
        TD_SCDMA
        HSPA+
        EVDO Rev.0
        EVDO Rev.A
        EVDO Rev.B
      if get current network information failed, the return value will be null.
     return : void
     @method getCurrentNetwork
     **************************************************************************/
    function getCurrentNetwork(callback) {
        asyncRequest("current_network",callback,function(data){
             // the object of network information
            var vNetwork = {};
            vNetwork.strFullName = data.strFullName;
            vNetwork.strShortName = data.strShortName;
            vNetwork.strNumeric = data.strNumeric;
            vNetwork.nRat = Number(data.nRat);
            vNetwork.strBearer = data.strBearer;
            return [true,vNetwork];
        });    
    }

    /**
     * 保存一条电话本
     * @method savePhoneBook
     * @param {Object} JSON
     * @example
     * //请求参数映射
     * {
     *  location = 0;
     *  name = "张三";
     *  mobile_phone_number = "13500000015";
     *  home_phone_number = "012-12345678";
     *  office_phone_number = "012-87654321";
     *  mail = "mail@mail.com";
     * }
     * @return {Object} JSON
     */
    function savePhoneBook() {
        var callback = arguments[1];
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.notCallback = true;
            requestParams.goformId = "PBM_CONTACT_ADD";
            requestParams.location = params.location;
            requestParams.name = encodeMessage(params.name);
            requestParams.mobilephone_num = params.mobile_phone_number;
            if (requestParams.location == 1) {
                requestParams.add_index_pc = params.index;
                requestParams.homephone_num = params.home_phone_number;
                requestParams.officephone_num = params.office_phone_number;
                requestParams.email = encodeMessage(params.mail);
                requestParams.groupchoose = params.group;
                if(!requestParams.groupchoose){
                    requestParams.groupchoose = "common";
                }
            } else {
                requestParams.edit_index = params.index;
            }
            return requestParams;
        }

        function deal(data) {
            if (data && data.result == "success") {
                addTimerThings("pbm_write_flag", checkSavePhoneBook);
            } else {
                callback(data);
            }
        }

        function checkSavePhoneBook(data){
            checkPbmWriteFlag(data, callback, checkSavePhoneBook);
        }
    }

    function checkPbmWriteFlag(data, callback, fn) {
        if (data.pbm_write_flag == "0") {
            removeTimerThings("pbm_write_flag", fn);
            callback({result:"success"});
        } else if (data.pbm_write_flag == "6" || data.pbm_write_flag == "7" || data.pbm_write_flag == "8" || data.pbm_write_flag == "9"|| data.pbm_write_flag == "10"|| data.pbm_write_flag == "11"|| data.pbm_write_flag == "14") {
            removeTimerThings("pbm_write_flag", fn);
            callback({result:"fail"});
        } else {
          //noting to do,continue waiting
        }
    }

    /**
     * 删除电话本
     * @method deletePhoneBooks
     * @param {Object} JSON
     * @example
     * //请求参数映射
     * {
     *  indexs:["1","2","3"]
     * }
     * @return {Object} JSON
     */
    function deletePhoneBooks() {
        var callback = arguments[1];
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.notCallback = true;
            requestParams.goformId = "PBM_CONTACT_DEL";
            requestParams.del_option = "delete_num";
            requestParams.delete_id = params.indexs.join(",");
            return requestParams;
        }

        function deal(data) {
            if (data && data.result == "success") {
                addTimerThings("pbm_write_flag", checkDeletePhoneBooks);
            } else {
                callback(data);
            }
        }

        function checkDeletePhoneBooks(data){
            checkPbmWriteFlag(data, callback, checkDeletePhoneBooks);
        }
    }

    /**
     * 删除所有电话本数据
     * @method deleteAllPhoneBooks
     * @param {Object} JSON
     * @example
     * //请求参数映射
     * {
     *   location:0
     * }
     * @return {Object} JSON
     */
    function deleteAllPhoneBooks() {
        var callback = arguments[1];
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.notCallback = true;
            requestParams.goformId = "PBM_CONTACT_DEL";
            requestParams.del_option = "delete_all";
            requestParams.del_all_location = params.location;
            return requestParams;
        }

        function deal(data) {
            if (data && data.result == "success") {
                addTimerThings("pbm_write_flag", checkDeleteAllPhoneBooks);
            } else {
                callback(data);
            }
        }

        function checkDeleteAllPhoneBooks(data){
            checkPbmWriteFlag(data, callback, checkDeleteAllPhoneBooks);
        }
    }

    /**
     * 按分组删除所有电话本数据
     * @method deleteAllPhoneBooksByGroup
     * @param {Object} JSON
     * @example
     * //请求参数映射
     * {
     *   del_group:'common'
     * }
     * @return {Object} JSON
     */
    function deleteAllPhoneBooksByGroup() {
        var callback = arguments[1];
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.notCallback = true;
            requestParams.goformId = "PBM_CONTACT_DEL";
            requestParams.del_option = "delete_all_by_group";
            requestParams.del_all_location = 3;
            requestParams.del_group = params.group;
            return requestParams;
        }

        function deal(data) {
            if (data && data.result == "success") {
                addTimerThings("pbm_write_flag", checkDeleteAllPhoneBooksByGroup);
            } else {
                callback(data);
            }
        }

        function checkDeleteAllPhoneBooksByGroup(data){
            checkPbmWriteFlag(data, callback, checkDeleteAllPhoneBooksByGroup);
        }
    }

    function setConnectionMode() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.goformId = "SET_CONNECTION_MODE";
            requestParams.isTest = isTest;
            requestParams.ConnectionMode = params.connectionMode;
            requestParams.roam_setting_option = params.isAllowedRoaming;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                callback(data);
            }
        }
    }


    function getConnectionMode() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "ConnectionMode";
            return requestParams;
        }
        
        function deal(data) {
            if (data) {
                var result = {};
                result.connectionMode = data.connectionMode;
                result.isAllowedRoaming = data.autoConnectWhenRoaming;
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    function _getPhoneBooks(args, location) {
        if (args[0].data_per_page == 0) {
            return {"pbm_data":[]};
        }
        return doStuff(args, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.mem_store = location;
            if (location == 2) {
                requestParams.cmd = "pbm_data_total";
            } else {
                requestParams.cmd = "pbm_data_info";
            }
            requestParams.page = params.page;
            requestParams.data_per_page = params.data_per_page;
            requestParams.orderBy = params.orderBy;
            requestParams.isAsc = params.isAsc;
            requestParams.group = params.group;//add 20180424
            return requestParams;
        }

        function deal(data) {
            if (data && data.pbm_data) {
                var books = [];
                $.each(data.pbm_data, function (i) {
                    books.push({
                        pbm_id:data.pbm_data[i].pbm_id,
                        pbm_location:data.pbm_data[i].pbm_location,
                        pbm_number:data.pbm_data[i].pbm_number,
                        pbm_anr:data.pbm_data[i].pbm_anr,
                        pbm_anr1:data.pbm_data[i].pbm_anr1,
                        pbm_group:data.pbm_data[i].pbm_group,
                        pbm_name:decodeMessage(data.pbm_data[i].pbm_name),
                        pbm_email:decodeMessage(data.pbm_data[i].pbm_email)
                    });
                });
                return {pbm_data:books};
            } else {
                return unknownErrorObject;
            }
        }
    }
    /**
     * 按分组获取设备侧电话本数据
     * @method getPhoneBooksByGroup
     * @return {Object} JSON
     */
    function getPhoneBooksByGroup() {
        if (arguments[0].data_per_page == 0) {
            return {"pbm_data":[]};
        }
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "pbm_data_total";
            requestParams.mem_store = 3;
            requestParams.pbm_group = params.group;
            requestParams.page = params.page;
            requestParams.data_per_page = params.data_per_page;
            requestParams.orderBy = params.orderBy;
            requestParams.isAsc = params.isAsc;
            return requestParams;
        }

        function deal(data) {
            if (data && data.pbm_data) {
                var books = [];
                $.each(data.pbm_data, function (i) {
                    books.push({
                        pbm_id:data.pbm_data[i].pbm_id,
                        pbm_location:data.pbm_data[i].pbm_location,
                        pbm_number:data.pbm_data[i].pbm_number,
                        pbm_anr:data.pbm_data[i].pbm_anr,
                        pbm_anr1:data.pbm_data[i].pbm_anr1,
                        pbm_group:data.pbm_data[i].pbm_group,
                        pbm_name:decodeMessage(data.pbm_data[i].pbm_name),
                        pbm_email:decodeMessage(data.pbm_data[i].pbm_email)
                    });
                });
                return {pbm_data:books};
            } else {
                return unknownErrorObject;
            }
        }
    }
    /**
     * 获取设备侧电话本数据
     * @method getDevicePhoneBooks
     * @return {Object} JSON
     */
    function getDevicePhoneBooks() {
        return _getPhoneBooks(arguments, 1);
    }

    /**
     * 获取SIM卡侧电话本数据
     * @method getSIMPhoneBooks
     * @return {Object} JSON
     */
    function getSIMPhoneBooks() {
        return _getPhoneBooks(arguments, 0);
    }

    /**
     * 获取电话本数据,包括SIM卡和设备侧
     * @method getPhoneBooks
     * @return {Object} JSON
     */
    function getPhoneBooks() {
        return _getPhoneBooks(arguments, 2);
    }

    function getPhoneBookReady(){
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "pbm_init_flag";
            requestParams.multi_data = 1;//wenping add
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    function getPhoneBookCapacity(args, isSIM) {
        return doStuff(args, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "pbm_capacity_info";
            if (isSIM) {
                requestParams.pbm_location = "pbm_sim";
            } else {
                requestParams.pbm_location = "pbm_native";
            }
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取SIM卡侧电话本容量
     * @method getSIMPhoneBookCapacity
     * @return {Object} JSON
     * @example
      //请求参数映射
     {
         simPbmTotalCapacity:100,
         simPbmUsedCapacity:20,
         simType:?, //2G or 3G used to extend pbm
         maxNameLen:?,
         maxNumberLen:?
     }
     */
    function getSIMPhoneBookCapacity() {
        var data = getPhoneBookCapacity(arguments, true);
        return {
            simPbmTotalCapacity:parseInt(data.pbm_sim_max_record_num),
            simPbmUsedCapacity:parseInt(data.pbm_sim_used_record_num),
            simType:data.pbm_sim_type, //2G or 3G used to extend pbm
            maxNameLen:parseInt(data.pbm_sim_max_name_len),
            maxNumberLen:parseInt(data.pbm_sim_max_number_len)
        };
    }

    /**
     * 获取设备电话本容量
     * @method getDevicePhoneBookCapacity
     * @return {Object} JSON
     * @example
      //返回结果
     {
         pcPbmTotalCapacity:100，
         pcPbmUsedCapacity:30
     }
     */
    function getDevicePhoneBookCapacity() {
        var data = getPhoneBookCapacity(arguments, false);
        return {
            pcPbmTotalCapacity:parseInt(data.pbm_dev_max_record_num),
            pcPbmUsedCapacity:parseInt(data.pbm_dev_used_record_num)
        };
    }

    /**
     * 获取登录相关信息
     * @method getLoginData
     * @return {Object} JSON
     */
    function getLoginData(){
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "modem_main_state,puknumber,pinnumber,psw_fail_num_str,login_lock_time,admin_user,admin_Password";    //1.24   fanjj  default username and password
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                data.psw_fail_num_str = data.psw_fail_num_str == '' ? config.MAX_LOGIN_COUNT : data.psw_fail_num_str;
                data.login_lock_time = data.login_lock_time == '' ? '300' : data.login_lock_time;
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取登录状态
     * @method login
     * @param {Object} JSON
     * @example
     * //返回结果格式
     *{
     *   password:"123456"
     *}
     * @return {Object} JSON
     */
    function login() {
        return doStuff(arguments, {}, prepare, deal, {errorType: 'badPassword'}, true);

        function prepare(params, isPost){
            var obj = {
                isTest : isTest,
                goformId : "LOGIN",
                password : config.PASSWORD_ENCODE ? Base64.encode(params.password) : params.password
            };
            return obj;
        }

        function deal(data){
            //in doc, notes:If the user is 'already logged in' at the device, it calls back as success.
            if(data && (data.result == "0" || data.result == "4")){
                timerInfo.isLoggedIn = true;
                return     {result: true};
            }else{
                var loginError = {};
                switch(data.result){
                    case "1":
                        loginError = {errorType : "Login Fail"};
                        break;
                    case "2":
                        loginError = {errorType : "duplicateUser"};
                        break;
                    case "3":
                        loginError = {errorType : "badPassword"};
                        break;
                    /* case "4":
                     loginError = {errorType : "already logged in"};
                     break; */
                    default :
                        loginError = {errorType : "Login Fail"};
                        break;
                }
                timerInfo.isLoggedIn = false;
                return $.extend(unknownErrorObject, loginError);
            }
        }
    }

    /**
     * 获取登录状态
     * @method getLoginStatus
     * @return {Object} JSON
     * @example
     //返回结果格式
     {
        status = "loggedIn";
     }
     */
    function getLoginStatus() {
        if(timerInfo.isLoggedIn != undefined){
            return doStuff(arguments, {
                status : timerInfo.isLoggedIn ? 'loggedIn' : 'loggedOut'
            });
        }else{
            var resultObject = {};
            if(!config.HAS_LOGIN){
                resultObject.status = 'loggedIn';
                resultObject.errorType = 'no_login';
                timerInfo.isLoggedIn = true;
            }
            return doStuff(arguments, resultObject, prepare, deal, null, false);
        }

        function prepare(params, isPost){
            var requestParams  = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "loginfo";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data){
            if(data && data.loginfo){
                var loginStatus = {};
                //it should be an enum rather than Boolean
                switch(data.loginfo){
                    case "ok":
                        loginStatus.status = "loggedIn";
                        break;
                    default:
                        loginStatus.status = "loggedOut";
                        break;
                }
                currentLoginStatus = loginStatus.status;
                return loginStatus;
            }else{
                currentLoginStatus = undefined;
                return $.extend(unknownErrorObject, {errorType : "LoginStatusError"});
            }
        }
    }

    /**
     * 验证PIN输入是否正确
     * @method enterPIN
     * @param {Object} JSON 参数对象
     * @example
      //请求参数映射
     {
        PinNumber = "1234";
     }
     * @return {Object} JSON
     */
    function enterPIN() {
        return doStuff(arguments, {}, prepare, deal,{}, true);

        function prepare(params, isPost){
            var obj = {};
            obj.isTest = isTest;
            obj.goformId = "ENTER_PIN";
            obj.PinNumber = params.PinNumber;
            return obj;
        }

        function deal(data) {
            if (data && data.result === "success") {
                return { result:true };
            } else {
                return { result:false};
            }
        }
    }

    /**
     * 根据PUK设置新的PIN
     * @method enterPUK
     * @param {Object} JSON 参数对象
     * @example
      //请求参数映射
     {
         PUKNumber = "12345678";
         PinNumber = "1234";
     }
     * @return {Object} JSON
     */
    function enterPUK() {
        return doStuff(arguments, {}, prepare, deal,{}, true);

        function prepare(params, isPost){
            var obj = {};
            obj.isTest = isTest;
            obj.goformId = "ENTER_PUK";
            obj.PUKNumber = params.PUKNumber;
            obj.PinNumber = params.PinNumber;
            return obj;
        }

        function deal(data) {
            if (data && data.result === "success") {
                return { result:true };
            } else {
                return { result:false};
            }
        }
    }

    /**
     * 获取全部短消息
     * @method getSMSMessages
     * @example
      //请求参数映射
         {
            cmd : "sms_page_data",
            page : params.page,
            data_per_page : params.smsCount,
            mem_store : params.nMessageStoreType,
            tags : params.tags,
            order_by : params.orderBy
        }
     */
    function getSMSMessages() {
        return doStuff(arguments, {}, prepare, deal, {}, false);

        function prepare(params, isPost) {
            var obj = {
                isTest : isTest,
                cmd : "sms_data_total",
                page : params.page,
                //data_per_page: config.SMS_DATABASE_SORT_SUPPORT ? params.smsCount : 500,
                data_per_page: config.SMS_DATABASE_SORT_SUPPORT ? params.smsCount : 15,//mod 180424
                mem_store : params.nMessageStoreType,
                tags : params.tags,
                order_by : params.orderBy
            };
            return obj;
        }

        function deal(data) {
            if (data && data.messages && data.messages.length > 0) {
                return {messages: parseMessages(data.messages) };
            } else {
                return {messages: [] };
            }
        }
    }
    
    function parseMessages(messages, isReport){
        var result = [];
        for(var i = 0 ; i < messages.length; i++){
            if(!config.SHOW_UN_COMPLETE_CONCAT_SMS && typeof messages[i].received_all_concat_sms != "undefined" && messages[i].received_all_concat_sms == '0'){
                continue;
            }
            var oneMessage = {};
            oneMessage.id = messages[i].id;
            oneMessage.number = messages[i].number;
            oneMessage.content = isReport ? messages[i].content : decodeMessageContent(messages[i].content);
            oneMessage.time = transTime('20' + messages[i].date);//parseTime(messages[i].date);
            oneMessage.isNew = messages[i].tag == "1";
            oneMessage.groupId = messages[i].draft_group_id;
            oneMessage.tag = messages[i].tag;
            result.push(oneMessage);
        }
        if (!config.SMS_DATABASE_SORT_SUPPORT) {
            var ids = [];
            var tmpResult = [];
            for (var i = result.length; i--;) {
                var n = result[i];
                var idx = $.inArray(n.id, ids);
                if (idx == -1) {
                    ids.push(n.id);
                    tmpResult.push(n);
                } else {
                    if (n.content.length > tmpResult[idx].content.length) {
                        tmpResult[idx] = n;
                    }
                }
            }
            return _.sortBy(tmpResult, function (n) {
                return 0 - n.id;
            });
        } else {
            return result;
        }
    }
    
    function decodeMessageContent(msgContent) {
        return decodeMessage(escapeMessage(msgContent));//.replace(/"/g, "\\\"");
    }
    
    /**
     * 发送短消息
     * @method sendSMS
     */
    function sendSMS() {
        var callback = arguments[1];
        var errorCabllback = arguments[2] ? arguments[2] : callback;
        return doStuff(arguments, {}, prepare, deal, null, true);
                
        function prepare(params, isPost){
            var obj = {
                isTest : isTest,
                goformId : "SEND_SMS",
                notCallback : true,
                Number : params.number,
                sms_time : getCurrentTimeString(),
                MessageBody : escapeMessage(encodeMessage(params.message)),
                ID : params.id,
                encode_type : getEncodeType(params.message).encodeType
            };
            return obj;
        }

        function deal(data){
            if(!data){
                errorCabllback($.extend(unknownErrorObject, {errorType: "sendFail", errorText: "send_fail_try_again"}));
                return;
            }
            if (data.result == "success") {
                var timer = window.setInterval(function() {
                    getSmsStatusInfo({
                        smsCmd : 4,
                        timer : timer,
                        errorType : "sendFail",
                        errorText : "send_fail_try_again"
                    }, callback, errorCabllback);
                }, 1000);
            } else {
                errorCabllback($.extend(unknownErrorObject, {errorType: "sendFail", errorText: "send_fail_try_again"}));
            }
        }
    }

    /**
     * 保存草稿
     * @method saveSMS
     */
    function saveSMS() {
        var callback = arguments[1];
        var errorCabllback = arguments[2] ? arguments[2] : callback;
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost){
            var obj = {
                isTest : isTest,
                notCallback : true,
                goformId : "SAVE_SMS",
                SMSMessage : escapeMessage(encodeMessage(params.message)), //短信内容
                SMSNumber : params.numbers.join(";") + ";",//短消息号码
                Index : params.index,//-1表示新建后保存；否则，表示编辑后保存，要传递实际的ID
                encode_type : getEncodeType(params.message).encodeType,
                sms_time : params.currentTimeString,
                draft_group_id : params.groupId //短信组编号
            };
            return obj;
        }

        function deal(data){
            if(!data){
                errorCabllback($.extend(unknownErrorObject, {errorType: "saveFail", errorText: "save_fail"}));
                return;
            }
            if (data.result == "success") {
                var timer = window.setInterval(function() {
                    getSmsStatusInfo({
                        smsCmd : 5,
                        timer : timer,
                        errorType : "saveFail",
                        errorText : "save_fail"
                    }, callback, errorCabllback);
                }, 1000);
            } else {
                errorCabllback($.extend(unknownErrorObject, {errorType: "saveFail", errorText: "save_fail"}));
            }
        }
    }
    
    /**
     * 删除全部短消息
     * -- 目前经UE确认，移除了删除全部短信功能。此方法暂时保留
     * 
     * @method deleteAllMessages
     */
    function deleteAllMessages(){
        var callback = arguments[1];
        var errorCabllback = arguments[2] ? arguments[2] : callback;
        
        return doStuff(arguments, {}, prepare, deal, null, true);
                
        function prepare(params, isPost){
            //TODO: 由于不分箱子，所有和92实现会不同
            var obj = {
                isTest : isTest,
                goformId : "ALL_DELETE_SMS",
                notCallback : true,
                which_cgi: params.location
            };
            return obj;
        }

        function deal(data){
            if(!data){
                errorCabllback($.extend(unknownErrorObject, {errorType: "deleteFail", errorText: "delete_fail_try_again"}));
                return;
            }
            if (data.result == "success") {
                addTimerThings("sms_cmd_status_info", checkDeleteStatus);
            } else {
                errorCabllback($.extend(unknownErrorObject, {errorType: "deleteFail", errorText: "delete_fail_try_again"}));
            }
        }

        function checkDeleteStatus(data) {
            var status = data.sms_cmd_status_info;
            if(status == "2"){
                removeTimerThings("sms_cmd_status_info", checkDeleteStatus);
                errorCabllback($.extend(unknownErrorObject, {errorType: "deleteFail", errorText: "delete_fail_try_again"}));
            } else if(status == "3"){
                removeTimerThings("sms_cmd_status_info", checkDeleteStatus);
                callback({result: true});
            }
        }
    }
    
    function deleteMessage() {
        var callback = arguments[1];
        var errorCabllback = arguments[2] ? arguments[2] : callback;
        
        return doStuff(arguments, {}, prepare, deal, null, true);
                
        function prepare(params, isPost){
            var msgIds = params.ids.join(";") + ";";
            var obj = {
                isTest : isTest,
                goformId : "DELETE_SMS",
                msg_id : msgIds,
                notCallback : true
            };
            return obj;
        }

        function deal(data){
            if(!data){
                errorCabllback($.extend(unknownErrorObject, {errorType: "deleteFail", errorText: "delete_fail_try_again"}));
                return;
            }
            if (data.result == "success") {
                var timer = window.setInterval(function() {
                    getSmsStatusInfo({
                        smsCmd : 6,
                        timer : timer,
                        errorType : "deleteFail",
                        errorText : "delete_fail_try_again"
                    }, callback, errorCabllback);
                }, 1000);
            } else {
                errorCabllback($.extend(unknownErrorObject, {errorType: "deleteFail", errorText: "delete_fail_try_again"}));
            }
        }
    }
    
    function getSmsStatusInfo(obj, callback, errorCabllback){
        asyncRequest({
            cmd: "sms_cmd_status_info",
            sms_cmd: obj.smsCmd,
            isTest: isTest
        }, function(data){
            if(data){
                var status = data.sms_cmd_status_result;
                if(status == "2"){
                    window.clearInterval(obj.timer);
                    errorCabllback($.extend(unknownErrorObject, {errorType: obj.errorType, errorText: obj.errorText}));
                }else if(status == "3"){
                    window.clearInterval(obj.timer);
                    callback({result: "success"});
                }
            }else{
                window.clearInterval(obj.timer);
                errorCabllback($.extend(unknownErrorObject, {errorType: obj.errorType, errorText: obj.errorText}));
            }
        }, function(data){
            window.clearInterval(obj.timer);
            errorCabllback($.extend(unknownErrorObject, {errorType: obj.errorType, errorText: obj.errorText}));
        }, false);
    }


    function getSMSReady(){
        if(config.smsIsReady){
            var callback = arguments[1];
            if(callback){
                return callback({"sms_cmd":"1","sms_cmd_status_result":"3"});
            }else{
                return {"sms_cmd":"1","sms_cmd_status_result":"3"};
            }
        } else {
            return doStuff(arguments, {}, prepare, deal, null, false);
        }

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "sms_cmd_status_info";
            requestParams.sms_cmd = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                if(data.sms_cmd_status_result == "3"){
                    config.smsIsReady = true;
                }
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }
    /**
     * 新短信设置为已读
     * @method setSmsRead
     * @param {String} ids 以分号分隔的短信编号
     */
    function setSmsRead() {
        
        return doStuff(arguments, {}, prepare, deal, null, true);
        
        function prepare(params, isPost){
            var msgIds = params.ids.join(";");
            if(params.ids.length > 0){
                msgIds += ";";
            }
            var obj = {
                isTest : isTest,
                goformId : "SET_MSG_READ",
                msg_id : msgIds,
                tag : 0
            };
            return obj;
        }

        function deal(data){
            if (data.result == "success") {
                return {result: true};
            } else {
                return {result: false};
            }
        }
    }
    
    /**
     * 获取短信发送报告列表
     * @method getSMSDeliveryReport
     */
    function getSMSDeliveryReport(){
        return doStuff(arguments, {}, prepare, deal, {}, false);

        function prepare(params, isPost) {
            var obj = {
                isTest : isTest,
                cmd : "sms_status_rpt_data",
                page : params.page,
                data_per_page : params.smsCount
            };
            return obj;
        }

        function deal(data) {
            if (data) {
                return {messages: parseMessages(data.messages, true) };
            } else {
                return unknownErrorObject;
            }
        }
    }
    
    /**
     * 退出系统
     * 
     * @method logout
     * @return {Object} JSON
     */
    function logout() {

        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost){
            var obj = $.extend({}, params);
            obj.isTest = isTest;
            obj.goformId = "LOGOUT";
            return obj;
        }

        function deal(data){
            if(data && data.result == "success"){
                timerInfo.isLoggedIn = false;
                return {result: true};
            }else{
                return $.extend(unknownErrorObject, {errorType: "loggedOutError"});
            }
        }
    }

    /**
     * 获取PIN相关信息
     * @method changePassword
     * @param  {Object} JSON
     * @example
      //请求参数映射
     {
         oldPassword:"123456",
         newPassword:"234567"
     }
     * @return {Object} JSON
     */
    function changePassword() {

        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var obj = {};
            obj.newPassword = config.PASSWORD_ENCODE ? Base64.encode(params.newPassword) : params.newPassword;
            obj.oldPassword = config.PASSWORD_ENCODE ? Base64.encode(params.oldPassword) : params.oldPassword;
            obj.goformId = "CHANGE_PASSWORD";
            obj.isTest = isTest;
            return obj;
        }

        function deal(data) {
            if (data && data.result === "success") {
                return {
                    result : true
                };
            } else {
                return $.extend(unknownErrorObject, {
                    errorType : "badPassword"
                });
            }
        }
    }

    /**
     * 获取PIN相关信息
     * @method getPinData
     * @return {Object} JSON
     */
    function getPinData(){
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "pinnumber,pin_status,puknumber";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 启用PIN
     * @method enablePin
     * @param  {Object} JSON
     * @example
      //请求参数映射
     {
        oldPin = "1234";
     }
     * @return {Object} JSON
     */
    function enablePin() {

        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var obj = {};
            obj.goformId = "ENABLE_PIN";
            obj.OldPinNumber = params.oldPin;
            obj.isTest = isTest;
            return obj;
        }

        function deal(data) {
            if (data && data.result === "success") {
                return { result:true };
            } else {
                return { result:false};
            }
        }
    }

    /**
     * 禁用PIN
     * @method disablePin
     * @param  {Object} JSON
     * @example
      //请求参数映射
     {
         oldPin = "1234";
     }
     * @return {Object} JSON
     */
    function disablePin() {

        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var obj = {};
            obj.goformId = "DISABLE_PIN";
            obj.OldPinNumber = params.oldPin;
            obj.isTest = isTest;
            return obj;
        }

        function deal(data) {
            if (data && data.result === "success") {
                return { result:true };
            } else {
                return { result:false};
            }
        }
    }

    /**
     * 修改PIN
     * @method changePin
     * @param  {Object} JSON
     * @example
      //请求参数映射
     {
         oldPin = "2345";
         newPin = "1234";
     }
     * @return {Object} JSON
     */
    function changePin() {

        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var obj = {};
            obj.goformId = "ENABLE_PIN";
            obj.OldPinNumber = params.oldPin;
            obj.NewPinNumber = params.newPin;
            obj.isTest = isTest;
            return obj;
        }

        function deal(data) {
            if (data && data.result === "success") {
                return { result:true };
            } else {
                return { result:false};
            }
        }
    }

    /**
     * 获取路由信息
     * @method getLanInfo
     */
    function getLanInfo() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "lan_ipaddr,lan_netmask,mac_address,dhcpEnabled,dhcpStart,dhcpEnd,dhcpLease_hour";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.ipAddress = data.lan_ipaddr;
                result.subnetMask = data.lan_netmask;
                result.macAddress = data.mac_address;
                result.dhcpServer = data.dhcpEnabled;// == "1"? "enable" : "disable";
                result.dhcpStart = data.dhcpStart;
                result.dhcpEnd = data.dhcpEnd;
                result.dhcpLease = parseInt(data.dhcpLease_hour, 10);
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置路由信息
     * @method setLanInfo
     */
    function setLanInfo() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "DHCP_SETTING";
            requestParams.lanIp = params.ipAddress;
            requestParams.lanNetmask = params.subnetMask;
            requestParams.lanDhcpType = params.dhcpServer == "1"? "SERVER" : "DISABLE";
            if(requestParams.lanDhcpType == "SERVER") {
                requestParams.dhcpStart = params.dhcpStart;
                requestParams.dhcpEnd = params.dhcpEnd;
                requestParams.dhcpLease = params.dhcpLease;
            }
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取短信设置参数
     * @method getSmsSetting
     */
    function getSmsSetting() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "sms_parameter_info";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.centerNumber = data.sms_para_sca;
                result.memStroe = data.sms_para_mem_store;
                result.deliveryReport = data.sms_para_status_report;
                switch(parseInt(data.sms_para_validity_period)){
                    case 143:
                        result.validity = "twelve_hours";
                        break;
                    case 167:
                        result.validity = "one_day";
                        break;
                    case 173:
                        result.validity = "one_week";
                        break;
                    case 255:
                        result.validity = "largest";
                        break;
                    default:
                        result.validity = "twelve_hours";
                        break;
                }
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置短信参数
     * @method setSmsSetting
     */
    function setSmsSetting() {
        var callback = arguments[1];
        var errorCabllback = arguments[2] ? arguments[2] : callback;
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "SET_MESSAGE_CENTER";
            requestParams.save_time = params.validity;
            requestParams.MessageCenter = params.centerNumber;
            requestParams.status_save = params.deliveryReport;
            requestParams.save_location = 'native';
            requestParams.notCallback = true;
            return requestParams;
        }

        function deal(data) {
            if(!data){
                errorCabllback($.extend(unknownErrorObject, {errorType: "smsSettingFail", errorText: "error_info"}));
                return;
            }
            if (data.result == "success") {
                var timer = window.setInterval(function() {
                    getSmsStatusInfo({
                        smsCmd : 3,
                        timer : timer,
                        errorType : "smsSettingFail",
                        errorText : "error_info"
                    }, callback, errorCabllback);
                }, 1000);
            } else {
                errorCabllback($.extend(unknownErrorObject, {errorType: "deleteFail", errorText: "delete_fail_try_again"}));
            }
        }
    }

    /**
     * 恢复出厂设置
     * @method restoreFactorySettings
     * @return {Object} JSON
     */
    function restoreFactorySettings() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "RESTORE_FACTORY_SETTINGS";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 检测恢复出厂设置是否完成
     * @method checkRestoreStatus
     */
    function checkRestoreStatus(successCallback) {
        var requestParams = {};
        requestParams.isTest = isTest;
        requestParams.cmd = "restore_flag";
        requestParams.multi_data = 1;
        asyncRequest(requestParams, function (data) {
            if (data && data.restore_flag === "1") {
                successCallback();
            } else {
                setTimeout(function () {
                    checkRestoreStatus(successCallback);
                }, 5000);
            }
        }, function () {
            setTimeout(function () {
                checkRestoreStatus(successCallback);
            }, 5000);
        }, false);
    }

    /**
     * 获取wps相关信息
     * @method getWpsInfo
     */
    function getWpsInfo() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "WscModeOption,AuthMode,RadioOff,EncrypType,wps_mode,WPS_SSID,m_ssid_enable,SSID1,m_SSID,m_EncrypType";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.wpsFlag = data.WscModeOption;
                result.authMode = data.AuthMode;
                result.wpsType = data.wps_mode;
                result.radioFlag = data.RadioOff;
                result.encrypType = data.EncrypType;
                result.wpsSSID = data.WPS_SSID;
                result.ssidEnable = data.m_ssid_enable;
                result.ssid = data.SSID1;
                result.multiSSID = data.m_SSID;
                result.m_encrypType = data.m_EncrypType;
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 开启wps
     * @method openWps
     */
    function openWps() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "WIFI_WPS_SET";
            requestParams.WPS_SSID = params.wpsSSID;
            requestParams.wps_mode = params.wpsType;
            if(requestParams.wps_mode == 'PIN') {
                requestParams.wps_pin = params.wpsPin;
            }
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取wifi 休眠信息
     * @method getSleepInfo
     */
    function getSleepMode() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "sysIdleTimeToSleep";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.sleepMode = data.sysIdleTimeToSleep;
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置wifi休眠信息
     * @method
     */
    function setSleepMode() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "SET_WIFI_SLEEP_INFO";
            requestParams.sysIdleTimeToSleep = params.sleepMode;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取防火墙安全信息
     * @method getSysSecurity
     */
    function getSysSecurity() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "RemoteManagement,WANPingFilter";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.remoteFlag = data.RemoteManagement == "1"? "1" : "0";
                result.pingFlag = data.WANPingFilter == "1"? "1" : "0";
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置防火墙安全信息
     * @method setSysSecurity
     */
    function setSysSecurity() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "FW_SYS";
            requestParams.remoteManagementEnabled = params.remoteFlag;
            requestParams.pingFrmWANFilterEnabled = params.pingFlag;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取端口转发信息
     * @method getPortForward
     */
    function getPortForward() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "PortForwardEnable,PortForwardRules_0,PortForwardRules_1,PortForwardRules_2,PortForwardRules_3,PortForwardRules_4,PortForwardRules_5,PortForwardRules_6,PortForwardRules_7,PortForwardRules_8,PortForwardRules_9";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.portForwardEnable = data.PortForwardEnable;
                //from 93, refactory later
                var rules = [];
                if(data.PortForwardRules_0 != ""){
                    rules.push([0,data.PortForwardRules_0]);
                }
                if(data.PortForwardRules_1 != ""){
                    rules.push([1,data.PortForwardRules_1]);
                }
                if(data.PortForwardRules_2 != ""){
                    rules.push([2,data.PortForwardRules_2]);
                }
                if(data.PortForwardRules_3 != ""){
                    rules.push([3,data.PortForwardRules_3]);
                }
                if(data.PortForwardRules_4 != ""){
                    rules.push([4,data.PortForwardRules_4]);
                }
                if(data.PortForwardRules_5 != ""){
                    rules.push([5,data.PortForwardRules_5]);
                }
                if(data.PortForwardRules_6 != ""){
                    rules.push([6,data.PortForwardRules_6]);
                }
                if(data.PortForwardRules_7 != ""){
                    rules.push([7,data.PortForwardRules_7]);
                }
                if(data.PortForwardRules_8 != ""){
                    rules.push([8,data.PortForwardRules_8]);
                }
                if(data.PortForwardRules_9 != ""){
                    rules.push([9,data.PortForwardRules_9]);
                }
                result.portForwardRules = parsePortForwardRules(rules);
                return result;
            } else {
                return unknownErrorObject;
            }
        }

        //from 93, refactory later
        function parsePortForwardRules(data) {
            var rules = [];
            if(data && data.length > 0){
                for(var i = 0; i < data.length; i++){
                    var aRule = {};
                    var elements = data[i][1].split(",");
                    aRule.index = data[i][0];
                    aRule.ipAddress = elements[0];
                    aRule.portRange = elements[1] + ' - ' + elements[2];
                    aRule.protocol = transProtocol(elements[3]);
                    aRule.comment = elements[4];
                    rules.push(aRule);
                }
            }
            return rules;
        }
    }

    /**
     * 设置端口转发信息
     * @method setPortForward
     */
    function setPortForward() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "FW_FORWARD_ADD";
            requestParams.ipAddress = params.ipAddress;
            requestParams.portStart = params.portStart;
            requestParams.portEnd = params.portEnd;
            requestParams.protocol = params.protocol;
            requestParams.comment = params.comment;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 删除端口转发规则
     * @method setPortForward
     */
    function deleteForwardRules() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "FW_FORWARD_DEL";
            requestParams.delete_id = params.indexs.join(';') + ";";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 虚拟服务器设置
     * @method enableVirtualServer
     */
    function enableVirtualServer() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "VIRTUAL_SERVER";
            requestParams.PortForwardEnable = params.portForwardEnable;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取快速设置需要的数据
     * @method getQuickSettingInfo
     */
    function getQuickSettingInfo() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            var wpask = config.PASSWORD_ENCODE ? ",WPAPSK1_encode" : ",WPAPSK1";
            requestParams.cmd = "pdp_type,ipv6_pdp_type,RadioOff,SSID1,HideSSID,AuthMode,WscModeOption,ppp_status,apn_index,ipv6_apn_index,ipv6_APN_index,m_profile_name,apn_mode" + wpask +
                ",APN_config0,APN_config1,APN_config2,APN_config3,APN_config4,APN_config5,APN_config6,APN_config7,APN_config8,APN_config9,APN_config10,APN_config11,APN_config12,APN_config13,APN_config14,APN_config15,APN_config16,APN_config17,APN_config18,APN_config19" +
                ",ipv6_APN_config0,ipv6_APN_config1,ipv6_APN_config2,ipv6_APN_config3,ipv6_APN_config4,ipv6_APN_config5,ipv6_APN_config6,ipv6_APN_config7,ipv6_APN_config8,ipv6_APN_config9,ipv6_APN_config10,ipv6_APN_config11,ipv6_APN_config12,ipv6_APN_config13,ipv6_APN_config14,ipv6_APN_config15,ipv6_APN_config16,ipv6_APN_config17,ipv6_APN_config18,ipv6_APN_config19";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                if(config.PASSWORD_ENCODE){
                    //data.WPAPSK1 = Base64.decode(data.WPAPSK1_encode);
                    //[yzy]quicksettingWifiPSW show
                    data.WPAPSK1 = data.WPAPSK1_encode;
                }
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 快速设置
     * @method getQuickSettingInfo
     */
    function setQuickSetting() {
        doStuffAndCheckServerIsOnline(arguments, prepare, deal);

        function prepare(params) {
            var requestParams = {
                isTest:isTest,
                goformId:"QUICK_SETUP",
                apn_mode:params.apnMode,
                Profile_Name:params.Profile_Name,
                APN_name:params.APN_name,
                ppp_auth_mode:params.ppp_auth_mode,
                ppp_username:params.ppp_username,
                ppp_passwd:params.ppp_passwd,
                SSID_name:params.SSID_name,
                SSID_Broadcast:params.SSID_Broadcast,
                Encryption_Mode_hid:params.Encryption_Mode_hid,
                security_shared_mode:params.security_shared_mode,
                WPA_PreShared_Key:config.PASSWORD_ENCODE ? Base64.encode(params.WPA_PreShared_Key) : (params.WPA_PreShared_Key),
                wep_default_key:params.wep_default_key,
                WPA_ENCRYPTION_hid:params.WPA_ENCRYPTION_hid
            };
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return $.extend(unknownErrorObject, {errorType:"SetSetUpError"});
            }
        }

    }

    /**
     * 快速设置(支持IPv6)
     * @method setQuickSetting4IPv6
     */
    function setQuickSetting4IPv6() {
        doStuffAndCheckServerIsOnline(arguments, prepare, deal);

        function prepare(params) {
            var requestParams = {
                isTest:isTest,
                goformId:"QUICK_SETUP_EX",
                index:params.apn_index,
                pdp_type:params.pdp_type,
                apn_mode:params.apnMode,
                profile_name:params.profile_name,
                wan_apn:params.wan_apn,
                ppp_auth_mode:params.ppp_auth_mode,
                ppp_username:params.ppp_username,
                ppp_passwd:params.ppp_passwd,
                ipv6_wan_apn:params.ipv6_wan_apn,
                ipv6_ppp_auth_mode:params.ipv6_ppp_auth_mode,
                ipv6_ppp_username:params.ipv6_ppp_username,
                ipv6_ppp_passwd:params.ipv6_ppp_passwd,
                SSID_name:params.SSID_name,
                SSID_Broadcast:params.SSID_Broadcast,
                Encryption_Mode_hid:params.Encryption_Mode_hid,
                security_shared_mode:params.security_shared_mode,
                WPA_PreShared_Key:config.PASSWORD_ENCODE ? Base64.encode(params.WPA_PreShared_Key) : params.WPA_PreShared_Key,
                wep_default_key:params.wep_default_key,
                WPA_ENCRYPTION_hid:params.WPA_ENCRYPTION_hid
            }
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return $.extend(unknownErrorObject, {errorType:"SetSetUpError"});
            }
        }
    }

    /**
     * 业务处理后，轮询检测服务器是否可以连接，可连接时执行回调函数
     * @method doStuffAndCheckServerIsOnline
     */
    function doStuffAndCheckServerIsOnline(arg, prepare, deal) {
        //server是否正常
        var isServerOnline = false;
        //callback是否执行
        var isCallbackExecuted = false;
        var params = prepare(arg[0]);
        var callback = arg[1];
        var successCallback = function (data) {
            isServerOnline = true;
            if (!isCallbackExecuted && callback) {
                callback(deal(data));
            }
            isCallbackExecuted = true;
        };
        var errorMethod = arg[2];
        var errorCallback = function () {
            isServerOnline = true;
            if (errorMethod) {
                errorMethod();
            }
        };

        asyncRequest(params, successCallback, errorCallback, true);

        addTimeout(function () {
            if (isServerOnline == false) {
                var timer = addInterval(function () {
                    if (isServerOnline == false) {
                        getLanguage({}, function (data) {
                            window.clearInterval(timer);
                            successCallback({result:"success"});
                        });
                    }
                }, 1000);
            }
        }, 5000);
    }

    /**
     * 获取SD Card配置信息
     * @method getSDConfiguration
     */
    function getSDConfiguration(){
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {
                isTest : isTest,
                cmd : "sdcard_mode_option,sdcard_select,sd_card_state,HTTP_SHARE_STATUS,HTTP_SHARE_CARD_USER,HTTP_SHARE_WR_AUTH,HTTP_SHARE_FILE_TO_SHARE,HTTP_SHARE_FILE",
                multi_data: 1
            };
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var fileToShare;
                //if(("mmc2" == data.HTTP_SHARE_FILE || "/mmc2" == data.HTTP_SHARE_FILE || "/mmc2/" == data.HTTP_SHARE_FILE) && "entire_sd_card"==data.HTTP_SHARE_FILE_TO_SHARE ){
                	if(("//" == data.HTTP_SHARE_FILE || "/" == data.HTTP_SHARE_FILE || "" == data.HTTP_SHARE_FILE) && "entire_sd_card"==data.HTTP_SHARE_FILE_TO_SHARE ){
                //if("entire_sd_card"==data.HTTP_SHARE_FILE_TO_SHARE ){
                    fileToShare = "1";
                } else {
                    fileToShare = "0";
                }
                var result = {
                    sd_mode: data.sdcard_mode_option == "1" ? "0" : "1",
                    sd_select:data.sdcard_select == "1" ? "0" : "1",
                    sd_status: data.sd_card_state,
                    share_status: data.HTTP_SHARE_STATUS == "Enabled" ? "1" : "0",
                    share_user: data.HTTP_SHARE_CARD_USER,
                    share_auth: data.HTTP_SHARE_WR_AUTH == "readWrite" ? "1" : "0",
                    file_to_share: fileToShare,
                    share_file: data.HTTP_SHARE_FILE
                };
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }
    
    function getUSBConfiguration(){
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {
                isTest : isTest,
                cmd : "sdcard_mode_option,sdcard_select,sd_card_state,HTTP_SHARE_STATUS,HTTP_SHARE_CARD_USER,HTTP_SHARE_WR_AUTH,HTTP_SHARE_FILE_TO_SHARE,HTTP_SHARE_FILE",
                multi_data: 1
            };
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var fileToShare;
                //if(("mmc2" == data.HTTP_SHARE_FILE || "/mmc2" == data.HTTP_SHARE_FILE || "/mmc2/" == data.HTTP_SHARE_FILE) && "entire_sd_card"==data.HTTP_SHARE_FILE_TO_SHARE ){
                if(("//" == data.HTTP_SHARE_FILE || "/" == data.HTTP_SHARE_FILE || "" == data.HTTP_SHARE_FILE) && "entire_sd_card"==data.HTTP_SHARE_FILE_TO_SHARE ){
                    fileToShare = "1";
                } else {
                    fileToShare = "0";
                }
                var result = {
                    sd_mode: data.sdcard_mode_option == "1" ? "0" : "1",
                    sd_select:data.sdcard_select == "1" ? "0" : "1",
                    sd_status: data.sd_card_state,
                    share_status: data.HTTP_SHARE_STATUS == "Enabled" ? "1" : "0",
                    share_user: data.HTTP_SHARE_CARD_USER,
                    share_auth: data.HTTP_SHARE_WR_AUTH == "readWrite" ? "1" : "0",
                    file_to_share: fileToShare,
                    share_file: data.HTTP_SHARE_FILE
                };
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }
    /**
     * 设置SD Card Mode
     * @method setSdCardMode
     */
    function setSdCardMode(){
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {
                isTest : isTest,
                goformId : "HTTPSHARE_MODE_SET",
                mode_set: params.mode == "0" ? "http_share_mode" : "usb_mode",
                sd_select:params.sdselect == "1" ? "internalsd":"externalsd"	
            };
            return requestParams;
        }

        function deal(data) {
            if (data && data.result == 'success') {
                return {result: true};
            } else {
                return {result: false};
            }
        }
    }
    
    /*function setSdCardSelect(){
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {
                isTest : isTest,
                goformId : "HTTPSHARE_SDCARD_SELECT_SET",
                sdcardset: params.mode == "0" ? "internalsd" : "externalsd"
            };
            return requestParams;
        }

        function deal(data) {
            if (data && data.result == 'success') {
                return {result: true};
            } else {
                return {result: false};
            }
        }
    }*/


    /**
     * 检查文件是否存在
     * @method checkFileExists
     */
    function checkFileExists(){
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {
                isTest : isTest,
                goformId : "GOFORM_HTTPSHARE_CHECK_FILE",
                path_SD_CARD: params.path
            };
            return requestParams;
        }

        function deal(data) {
            if (data) {
                if (data.result == "no_sdcard") {
                    return {
                        status : "no_sdcard"
                    };
                } else if (data.result == "noexist") {
                    return {
                        status : "noexist"
                    };
                } else {
                    return {
                        status : "exist"
                    };
                }
            } else {
                return unknownErrorObject;
            }
        }
    }
    
    function getDriverFileList() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {
                isTest : isTest,
                goformId : "DRIVERSHARE_ENTERFOLD",
            };
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return parseDriverFile(data.result);
            } else {
                return unknownErrorObject;
            }
        }

        function parseDriverFile(result) {
            var fileInfo = {};
            fileInfo.totalRecord = result.totalRecord;
            var fileArr = [];
            var details = result.fileInfo;
            for ( var i = 0; details && i < details.length; i++) {
                if(details[i].fileName == ""){
                    continue;
                }
                var obj = {};
                obj.fileName = details[i].fileName;
                obj.attribute = details[i].attribute;
                obj.size = details[i].size;
                //obj.lastUpdateTime = details[i].lastUpdateTime;
                fileArr.push(obj);
            }
            fileInfo.details = fileArr;
            return fileInfo;
        }
    }

    /**
     * 进入文件夹，并获取文件夹内文件列表
     *
     * @method getFileList
     * @return {Object}
     * @example
     *         {"result":{"totalRecord":"4", "fileInfo":[
     *          {"fileName":"card","attribute":"document","size":"0","lastUpdateTime":"20120510"},
     *          {"fileName":"cf","attribute":"document","size":"0","lastUpdateTime":"20120510"},
     *          {"fileName":"net","attribute":"document","size":"0","lastUpdateTime":"20120510"},
     *          {"fileName":"ram","attribute":"document","size":"0","lastUpdateTime":"20120510"}]}}
     */
    function getFileList() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {
                isTest : isTest,
                goformId : "HTTPSHARE_ENTERFOLD",
                path_SD_CARD : params.path,
                indexPage : params.index
            };
            return requestParams;
        }

        function deal(data) {
            if (data) {
                if (data.result == 'failure') {
                    return $.extend(unknownErrorObject, {
                        errorType : "get_file_list_failure"
                    });
                } else if (data.result == "no_sdcard") {
                    return $.extend(unknownErrorObject, {
                        errorType : "no_sdcard"
                    });
                } else {
                    return parseSdCardFile(data.result);
                }
            } else {
                return unknownErrorObject;
            }
        }

        function parseSdCardFile(result) {
            var fileInfo = {};
            fileInfo.totalRecord = result.totalRecord;
            var fileArr = [];
            var details = result.fileInfo;
            for ( var i = 0; details && i < details.length; i++) {
                if(details[i].fileName == ""){
                    continue;
                }
                var obj = {};
                obj.fileName = details[i].fileName;
                obj.attribute = details[i].attribute;
                obj.size = details[i].size;
                obj.lastUpdateTime = details[i].lastUpdateTime;
                fileArr.push(obj);
            }
            fileInfo.details = fileArr;
            return fileInfo;
        }
    }

    /**
     * sd card 文件重命名
     * @method fileRename
     * @return {Object}
     * @example
     * requestParams = {
            goformId : "HTTPSHARE_FILE_RENAME",
            path_SD_CARD : params.path,
            OLD_NAME_SD_CARD : oldpath,
            NEW_NAME_SD_CARD : newpath
        }
     */
    function fileRename(){
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var d = new Date();
            var currentTime = d.getTime();
            var zoneOffsetSeconds = d.getTimezoneOffset() * 60;
            return {
                isTest: isTest,
                goformId: "HTTPSHARE_FILE_RENAME",
                path_SD_CARD: params.path,
                OLD_NAME_SD_CARD: params.oldPath,
                NEW_NAME_SD_CARD: params.newPath,
                path_SD_CARD_time: transUnixTime(currentTime),
                path_SD_CARD_time_unix: Math.round((currentTime - zoneOffsetSeconds * 1000) / 1e3)
            };
        }

        function deal(data) {
            if (data) {
                if (data.result == "success") {
                    return {
                        result : true
                    };
                } else if (data.result == "no_sdcard") {
                    return $.extend(unknownErrorObject, {
                        errorType : "no_sdcard"
                    });
                } else {
                    return {
                        result : false
                    };
                }
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取SD Card容量
     * @method getSdMemorySizes
     * @return {Object}
     * @example
     * {
            totalMemorySize : data.sd_card_total_size,
            availableMemorySize : data.sd_card_avi_space
        }
     */
    function getSdMemorySizes() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {
                isTest : isTest,
                cmd : "HTTPSHARE_GETCARD_VALUE"
            };
            return requestParams;
        }

        function deal(data) {
            if (!data || (data.result && data.result == "no_sdcard")) {
                return $.extend(unknownErrorObject, {
                    errorType : "no_sdcard"
                });
            } else {
                return {
                    totalMemorySize : data.sd_card_total_size == "" ? 0 : data.sd_card_total_size * 32 * 1024,
                    availableMemorySize : data.sd_card_avi_space == "" ? 0 : data.sd_card_avi_space * 32 * 1024
                };
            }
        }
    }

    /**
     * 删除文件和文件夹
     *
     * @method deleteFilesAndFolders
     * @return {Object}
     * @example
     * {
     *         goformId : "HTTPSHARE_DEL",
     *         path_SD_CARD: params.path,
     *      name_SD_CARD: params.names
     *  }
     */
    function deleteFilesAndFolders(){
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {
                isTest : isTest,
                goformId : "HTTPSHARE_DEL",
                path_SD_CARD : params.path,
                name_SD_CARD : params.names
            };
            return requestParams;
        }

        function deal(data) {
            if (data.result && data.result == "failure") {
                return $.extend(unknownErrorObject, {
                    errorType : "delete_folder_failure"
                });
            } else if (data.result && data.result == "no_sdcard") {
                return $.extend(unknownErrorObject, {
                    errorType : "no_sdcard"
                });
            } else if (data.result && data.result == "success") {
                return {
                    result : true
                };
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 创建文件夹
     *
     * @method createFolder
     * @return {Object}
     * @example
     * {
     *         goformId : "HTTPSHARE_DEL",
     *         path_SD_CARD: params.path,
     *      name_SD_CARD: params.names
     *  }
     */
    function createFolder() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var d = new Date();
            var currentTime = d.getTime();
            var zoneOffsetSeconds = d.getTimezoneOffset() * 60;
            return {
                isTest: isTest,
                goformId: "HTTPSHARE_NEW",
                path_SD_CARD: params.path,
                path_SD_CARD_time: transUnixTime(currentTime),
                path_SD_CARD_time_unix: Math.round((currentTime - zoneOffsetSeconds * 1000) / 1e3)
            };
        }

        function deal(data) {
            if (data.result && data.result == "failure") {
                return $.extend(unknownErrorObject, {
                    errorType : "create_folder_failure"
                });
            } else if (data.result && data.result == "no_sdcard") {
                return $.extend(unknownErrorObject, {
                    errorType : "no_sdcard"
                });
            } else if (data.result && data.result == "success") {
                return {
                    result : true
                };
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 检查文件上传状态
     *
     * @method checkUploadFileStatus
     * @return {Object}
     */
    function checkUploadFileStatus(){
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {
                isTest : isTest,
                cmd : "CheckUploadFileStatus"
            };
            return requestParams;
        }

        function deal(data) {
            if (data) {
                if (data.result == "5") {
                    return {
                        result : false
                    };
                } else if (data.result == "6") {
                    return {
                        result : true
                    };
                } else {
                    return {
                        result : false
                    };
                }
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置SD 卡共享参数
     *
     * @method setSdCardSharing
     * @return {Object}
     * @example
     * requestParams = {
                isTest : isTest,
                goformId : "HTTPSHARE_AUTH_SET",
                HTTP_SHARE_STATUS: params.share_status == "1" ? "Enabled" : "Disabled",
                HTTP_SHARE_WR_AUTH: params.share_auth == "1" ? "readWrite" : "readOnly",
                HTTP_SHARE_FILE: params.share_file
            };
     */
    function setSdCardSharing(){
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {
                isTest : isTest,
                goformId : "HTTPSHARE_AUTH_SET",
                HTTP_SHARE_STATUS: params.share_status == "1" ? "Enabled" : "Disabled",
                HTTP_SHARE_WR_AUTH: params.share_auth == "1" ? "readWrite" : "readOnly",
				HTTP_SHARE_FILE_TO_SHARE:params.file_to_share == "1" ? "entire_sd_card" : "custom",
                HTTP_SHARE_FILE: params.share_file
            };
            return requestParams;
        }

        function deal(data) {
            if (data) {
                if (data.result == "no_sdcard") {
                    return $.extend(unknownErrorObject, {
                        errorType : "no_sdcard"
                    });
                } else {
                    return {
                        result : true
                    };
                }
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取端口过滤信息
     * @method getPortFilter
     */
    function getPortFilter() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "IPPortFilterEnable,DefaultFirewallPolicy,IPPortFilterRules_0,IPPortFilterRules_1,IPPortFilterRules_2,IPPortFilterRules_3,IPPortFilterRules_4,IPPortFilterRules_5,IPPortFilterRules_6,IPPortFilterRules_7,IPPortFilterRules_8,IPPortFilterRules_9";

            if(config.USE_IPV6_INTERFACE) {
                requestParams.cmd += ",IPPortFilterRulesv6_0,IPPortFilterRulesv6_1,IPPortFilterRulesv6_2,IPPortFilterRulesv6_3,IPPortFilterRulesv6_4,IPPortFilterRulesv6_5,IPPortFilterRulesv6_6,IPPortFilterRulesv6_7,IPPortFilterRulesv6_8,IPPortFilterRulesv6_9";
            }

            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.portFilterEnable = data.IPPortFilterEnable;
                result.defaultPolicy = data.DefaultFirewallPolicy;
                //from 93, refactory later
                var rules = [];
                if(data.IPPortFilterRules_0 != ""){
                    rules.push([0,data.IPPortFilterRules_0]);
                }
                if(data.IPPortFilterRules_1 != ""){
                    rules.push([1,data.IPPortFilterRules_1]);
                }
                if(data.IPPortFilterRules_2 != ""){
                    rules.push([2,data.IPPortFilterRules_2]);
                }
                if(data.IPPortFilterRules_3 != ""){
                    rules.push([3,data.IPPortFilterRules_3]);
                }
                if(data.IPPortFilterRules_4 != ""){
                    rules.push([4,data.IPPortFilterRules_4]);
                }
                if(data.IPPortFilterRules_5 != ""){
                    rules.push([5,data.IPPortFilterRules_5]);
                }
                if(data.IPPortFilterRules_6 != ""){
                    rules.push([6,data.IPPortFilterRules_6]);
                }
                if(data.IPPortFilterRules_7 != ""){
                    rules.push([7,data.IPPortFilterRules_7]);
                }
                if(data.IPPortFilterRules_8 != ""){
                    rules.push([8,data.IPPortFilterRules_8]);
                }
                if(data.IPPortFilterRules_9 != ""){
                    rules.push([9,data.IPPortFilterRules_9]);
                }
                result.portFilterRules = parsePortFilterRules(rules, "IPv4");

                //ipv6
                if(config.USE_IPV6_INTERFACE) {
                    var v6Rules = [];
                    if(data.IPPortFilterRulesv6_0 != ""){
                        v6Rules.push([10,data.IPPortFilterRulesv6_0]);
                    }
                    if(data.IPPortFilterRulesv6_1 != ""){
                        v6Rules.push([11,data.IPPortFilterRulesv6_1]);
                    }
                    if(data.IPPortFilterRulesv6_2 != ""){
                        v6Rules.push([12,data.IPPortFilterRulesv6_2]);
                    }
                    if(data.IPPortFilterRulesv6_3 != ""){
                        v6Rules.push([13,data.IPPortFilterRulesv6_3]);
                    }
                    if(data.IPPortFilterRulesv6_4 != ""){
                        v6Rules.push([14,data.IPPortFilterRulesv6_4]);
                    }
                    if(data.IPPortFilterRulesv6_5 != ""){
                        v6Rules.push([15,data.IPPortFilterRulesv6_5]);
                    }
                    if(data.IPPortFilterRulesv6_6 != ""){
                        v6Rules.push([16,data.IPPortFilterRulesv6_6]);
                    }
                    if(data.IPPortFilterRulesv6_7 != ""){
                        v6Rules.push([17,data.IPPortFilterRulesv6_7]);
                    }
                    if(data.IPPortFilterRulesv6_8 != ""){
                        v6Rules.push([18,data.IPPortFilterRulesv6_8]);
                    }
                    if(data.IPPortFilterRulesv6_9 != ""){
                        v6Rules.push([19,data.IPPortFilterRulesv6_9]);
                    }
                    result.portFilterRules = _.union(result.portFilterRules, parsePortFilterRules(v6Rules, "IPv6"));
                }

                return result;
            } else {
                return unknownErrorObject;
            }
        }

        //from 93, refactory later
        function parsePortFilterRules(data, ipTypeTmp) {
            var rules = [];
            if(data && data.length > 0){
                for(var i = 0; i < data.length; i++){
                    var aRule = {};
                    //192.168.0.5,0,1,6,192.168.0.53,0,1,655,1,1,kk,00:1E:90:FF:FF:FF
                    var elements = data[i][1].split(",");
                    aRule.index = data[i][0];
                    aRule.macAddress = elements[11];
                    aRule.destIpAddress = elements[4] == "any/0"? "" : elements[4];
                    aRule.sourceIpAddress = elements[0] == "any/0"? "" : elements[0];
                    aRule.destPortRange = elements[6] == '0' ? '' : elements[6] + " - " + elements[7];
                    aRule.sourcePortRange = elements[2] == '0' ? '' : elements[2] + " - " + elements[3];
                    aRule.action = elements[9] == 1 ? "filter_accept" : "filter_drop";
                    aRule.protocol = transProtocol(elements[8]);
                    aRule.comment = elements[10];
                    aRule.ipType = ipTypeTmp;
                    rules.push(aRule);
                }
            }
            return rules;
        }
    }

    /**
     * 设置端口过滤基本信息
     * @method setPortFilterBasic
     */
    function setPortFilterBasic() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "BASIC_SETTING";
            requestParams.portFilterEnabled = params.portFilterEnable;
            requestParams.defaultFirewallPolicy = params.defaultPolicy;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置端口过滤信息
     * @method setPortFilter
     */
    function setPortFilter() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            if(config.USE_IPV6_INTERFACE) {
                requestParams.goformId = "ADD_IP_PORT_FILETER_V4V6";
                requestParams.ip_version = params.ipType;
            }else {
                requestParams.goformId = "ADD_IP_PORT_FILETER";
            }

            requestParams.mac_address = params.macAddress;
            requestParams.dip_address = params.destIpAddress;
            requestParams.sip_address = params.sourceIpAddress;
            requestParams.dFromPort = params.destPortStart;
            requestParams.dToPort = params.destPortEnd;
            requestParams.sFromPort = params.sourcePortStart;
            requestParams.sToPort = params.sourcePortEnd;
            requestParams.action = params.action;
            requestParams.protocol = params.protocol;
            requestParams.comment = params.comment;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 删除端口过滤信息
     * @method deleteFilterRules
     */
    function deleteFilterRules() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;

            var deleteIds = _.filter(params.indexs, function(item){
                return item.length == 1;
            });

            if(config.USE_IPV6_INTERFACE) {
                requestParams.goformId = "DEL_IP_PORT_FILETER_V4V6";
                var deletev6Ids = [];
                _.each(params.indexs, function(item) {
                    if(item.length == 2) {
                        deletev6Ids.push(item.substring(1));
                    }
                });

                requestParams.delete_id_v6 = deletev6Ids.length > 0 ? deletev6Ids.join(';') + ";" : "";
            }else {
                requestParams.goformId = "DEL_IP_PORT_FILETER";
            }

            requestParams.delete_id = deleteIds.length > 0 ? deleteIds.join(';') + ";" : "";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取wifi高级信息
     * @method getWifiAdvance
     * @return {Object} wifi JSON 对象
     */
    function getWifiAdvance() {

        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "WirelessMode,CountryCode,Channel,HT_MCS,wifi_band,wifi_11n_cap";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {
                    mode : data.WirelessMode,
                    countryCode : data.CountryCode,
                    channel : data.Channel,
                    rate : data.HT_MCS,
                    wifiBand : data.wifi_band == 'a' ? 'a' : 'b',
                    bandwidth : data.wifi_11n_cap
                };
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置wifi高级信息
     * @method setWifiAdvance
     * @param {Object} JSON 参数对象
     */
    function setWifiAdvance() {
        doStuffAndCheckServerIsOnline(arguments, prepare, deal);

        function prepare(params) {
            var requestParams = {
                goformId : "SET_WIFI_INFO",
                isTest : isTest,
                wifiMode : params.mode,
                countryCode : params.countryCode
            };
            if(config.WIFI_BAND_SUPPORT){
                requestParams.wifi_band = params.wifiBand;
            }
            requestParams.selectedChannel = params.channel;
            if(!config.WIFI_BAND_SUPPORT || params.wifiBand != 'a'){ // 2.4G
                requestParams.abg_rate = params.rate;
            }
            if(config.WIFI_BANDWIDTH_SUPPORT){
                requestParams.wifi_11n_cap = params.bandwidth;
            }
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取设备基本信息
     * @method getDeviceInfo
     */
    function getDeviceInfo(){
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {
                isTest: isTest,
                cmd : "wifi_coverage,m_ssid_enable,imei,imei2,meid,web_version,wa_inner_version,hardware_version,MAX_Access_num," +
                    "SSID1,m_SSID,m_HideSSID,m_MAX_Access_num,m_Waittime,lan_ipaddr,cpuinfo1," +
                    "mac_address,msisdn,LocalDomain,wan_ipaddr,ipv6_wan_ipaddr,ipv6_pdp_type,ipv6_prefer_dns_auto,ipv6_standby_dns_auto,pdp_type,ppp_status,sim_imsi,rssi,rscp,lte_rsrp,lte_rsrq,lte_rssi,lte_snr,cell_id,network_type," +
            "rj45_mode,cable_wan_ipaddr,cable_wan_netmask,cable_wan_gateway,cable_prefer_dns,cable_standby_dns",
                multi_data : 1
            };
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var signal = null;
                var rsrp = null;
                var rsrq = null;
                var rssi = null;
                var snr = null;
                
                var type_2g = ["GSM", "GPRS", "EDGE"];
                var type_3g = ["UMTS", "HSDPA", "HSUPA", "HSPA", "HSPA+", "DC-HSPA+"];
                var type_4g = ["LTE"];
                if ($.inArray(data.network_type, type_2g) != -1) {
                    signal = data.rssi;
                    rssi = data.rssi;
                } else if ($.inArray(data.network_type, type_3g) != -1) {
                    signal = data.rscp;
                    rssi = data.rssi;
                } else if ($.inArray(data.network_type, type_4g) != -1) {
                    signal = data.lte_rsrp;
                    rsrp = data.lte_rsrp;
                    rsrq = data.lte_rsrq;
                    rssi = data.lte_rssi;
                    snr = data.lte_snr;
                    
                }

                return {
                    ssid: data.SSID1,
                    m_ssid: data.m_SSID,
                    m_max_access_num: data.m_MAX_Access_num,
                    multi_ssid_enable: data.m_ssid_enable,
                    ipAddress: data.lan_ipaddr,
                    wanIpAddress: data.wan_ipaddr,
                    ipv6WanIpAddress: data.ipv6_wan_ipaddr,
                    ipv6PdpType: data.ipv6_pdp_type,
                    ipv6_prefer_dns_auto:data.ipv6_prefer_dns_auto,
                    ipv6_standby_dns_auto:data.ipv6_standby_dns_auto,
                    macAddress: data.mac_address,
                    simSerialNumber: data.msisdn,
                    lanDomain: data.LocalDomain,
                    imei: data.imei,
                    imei2: data.imei2,
                    meid: data.meid,
                    web_version: data.web_version,
                    fw_version: data.wa_inner_version,
                    hw_version: data.hardware_version,
                    max_access_num: data.MAX_Access_num,
                    wifiRange: data.wifi_coverage,
                    pdpType: data.pdp_type,
                    connectStatus: data.ppp_status,
                    imsi:data.sim_imsi,
                    rj45_mode : data.rj45_mode,
                    cable_wan_ipaddr : data.cable_wan_ipaddr,
                    cable_wan_netmask : data.cable_wan_netmask,
                    cable_wan_gateway : data.cable_wan_gateway,
                    cable_prefer_dns : data.cable_prefer_dns,
                    cable_standby_dns : data.cable_standby_dns,
                    signal :signal,
                    rssi : rssi,
                    rsrp : rsrp,
                    rsrq : rsrq,
                    snr : snr,
                    cell_id : data.cell_id,
					//cpuinfo : 0/*data.cpuinfo*///for 673 is 0
                    cpuinfo : data.cpuinfo1
                    
                };
            } else {
                return unknownErrorObject;
            }
        }
    }
    
    /**
     * 获取Connection type
     * @method getConnectionStatus
     */
    function getConnectionStatus(){
        return doStuff(arguments, {}, prepare, deal, null, false);
        self.connectionstatus = ko.observable(verifyDeviceInfo(data.connectionstatus));
        self.rj45mac = ko.observable(verifyDeviceInfo(data.rj45mac));
        self.connectiontype = ko.observable(verifyDeviceInfo(data.connectiontype));
        self.connectionip = ko.observable(verifyDeviceInfo(data.connectionip));
        self.netmask = ko.observable(verifyDeviceInfo(data.netmask));

        function prepare(params, isPost) {
            var requestParams = {
                isTest: isTest,
                cmd : "connectionstatus,rj45mac,connectiontype,connectionip,netmask",
                multi_data : 1
            };
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return {
                	connectionstatus: data.connectionstatus,
                	rj45mac: data.rj45mac,
                	connectiontype: data.connectiontype,
                	connectionip: data.connectionip,
                	netmask: data.netmask,
                };
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取wifi覆盖范围
     * @method getWifiRange
     */
    function getWifiRange() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "wifi_coverage";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.wifiRangeMode = data.wifi_coverage;
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置wifi覆盖范围
     * @method getWifiRange
     */
    function setWifiRange() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.goformId = "SET_WIFI_COVERAGE";
            requestParams.isTest = isTest;
            requestParams.wifi_coverage = params.wifiRangeMode;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     *获取upnp信息
     * @method getUpnpSetting
     */
    function getUpnpSetting() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "upnpEnabled";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.upnpSetting = data.upnpEnabled == "1"? "1" : "0";
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     *设置upnp信息
     * @method setUpnpSetting
     */
    function setUpnpSetting() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.goformId = "UPNP_SETTING";
            requestParams.isTest = isTest;
            requestParams.upnp_setting_option = params.upnpSetting;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     *获取dmz信息
     * @method getUpnpSetting
     */
    function getDmzSetting() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "DMZEnable,DMZIPAddress";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.dmzSetting = data.DMZEnable == "1"? "1" : "0";
                result.ipAddress = data.DMZIPAddress;
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     *设置dmz信息
     * @method setDmzSetting
     */
    function setDmzSetting() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.goformId = "DMZ_SETTING";
            requestParams.isTest = isTest;
            requestParams.DMZEnabled = params.dmzSetting;
            if(requestParams.DMZEnabled == '1') {
                requestParams.DMZIPAddress = params.ipAddress;
            }

            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }
    /**
     *获取nat信息
     * @method getNatSetting
     */
    function getNatSetting() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "WWANAccessEnable";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
				result.WWANAccessEnable = data.WWANAccessEnable;
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }
         /**
     *设置nat信息
     * @method setNatSetting
     */
    function setNatSetting() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.goformId = "WEBSERVER_WWAN_ACCESS";
            requestParams.isTest = isTest;
			requestParams.WWANAccessEnable = params.WWANAccessEnable;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }
    /**
     * 获取端口映射规则
     * @method getPortMap
     */
    function getPortMap() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "PortMapEnable,PortMapRules_0,PortMapRules_1,PortMapRules_2,PortMapRules_3,PortMapRules_4,PortMapRules_5,PortMapRules_6,PortMapRules_7,PortMapRules_8,PortMapRules_9",
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.portMapEnable = data.PortMapEnable;
                //from 93, refactory later
                var rules = [];
                if(data.PortMapRules_0 != ""){
                    rules.push([0,data.PortMapRules_0]);
                }
                if(data.PortMapRules_1 != ""){
                    rules.push([1,data.PortMapRules_1]);
                }
                if(data.PortMapRules_2 != ""){
                    rules.push([2,data.PortMapRules_2]);
                }
                if(data.PortMapRules_3 != ""){
                    rules.push([3,data.PortMapRules_3]);
                }
                if(data.PortMapRules_4 != ""){
                    rules.push([4,data.PortMapRules_4]);
                }
                if(data.PortMapRules_5 != ""){
                    rules.push([5,data.PortMapRules_5]);
                }
                if(data.PortMapRules_6 != ""){
                    rules.push([6,data.PortMapRules_6]);
                }
                if(data.PortMapRules_7 != ""){
                    rules.push([7,data.PortMapRules_7]);
                }
                if(data.PortMapRules_8 != ""){
                    rules.push([8,data.PortMapRules_8]);
                }
                if(data.PortMapRules_9 != ""){
                    rules.push([9,data.PortMapRules_9]);
                }
                result.portMapRules = parsePortMapRules(rules);
                return result;
            } else {
                return unknownErrorObject;
            }
        }

        function parsePortMapRules(data) {
            var rules = [];
            if(data && data.length > 0){
                for(var i = 0; i < data.length; i++){
                    var aRule = {};
                    var elements = data[i][1].split(",");
                    aRule.index = data[i][0];
                    aRule.sourcePort = elements[1];
                    aRule.destIpAddress = elements[0];
                    aRule.destPort = elements[2];
                    aRule.protocol = transProtocol(elements[3]);
                    aRule.comment = elements[4];
                    rules.push(aRule);
                }
            }
            return rules;
        }
    }

    /**
     * 设置端口映射信息
     * @method setPortMap
     */
    function setPortMap() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "ADD_PORT_MAP";
            requestParams.portMapEnabled = params.portMapEnable;
            requestParams.fromPort = params.sourcePort;
            requestParams.ip_address = params.destIpAddress;
            requestParams.toPort = params.destPort;
            requestParams.protocol = params.protocol;
            requestParams.comment = params.comment;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 启用/禁用端口映射
     * @method enablePortMap
     */
    function enablePortMap() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "ADD_PORT_MAP";
            requestParams.portMapEnabled = params.portMapEnable;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 删除端口映射信息
     * @method deleteMapRules
     */
    function deleteMapRules() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "DEL_PORT_MAP";
            requestParams.delete_id = params.indexs.join(';') + ";";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }
      /**
     * 获取DNS过滤规则
     * @method getDnsMap
     */
    function getDnsMap() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "DnsMapRules_0,DnsMapRules_1,DnsMapRules_2,DnsMapRules_3,DnsMapRules_4,DnsMapRules_5,DnsMapRules_6,DnsMapRules_7,DnsMapRules_8,DnsMapRules_9",
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                var rules = [];
                 if(data.DnsMapRules_0 != ""){
                    rules.push([1,data.DnsMapRules_0]);
                }
                if(data.DnsMapRules_1 != ""){
                    rules.push([2,data.DnsMapRules_1]);
                }
                if(data.DnsMapRules_2 != ""){
                    rules.push([3,data.DnsMapRules_2]);
                }
                if(data.DnsMapRules_3 != ""){
                    rules.push([4,data.DnsMapRules_3]);
                }
                if(data.DnsMapRules_4 != ""){
                    rules.push([5,data.DnsMapRules_4]);
                }
                if(data.DnsMapRules_5 != ""){
                    rules.push([6,data.DnsMapRules_5]);
                }
                if(data.DnsMapRules_6 != ""){
                    rules.push([7,data.DnsMapRules_6]);
                }
                if(data.DnsMapRules_7 != ""){
                    rules.push([8,data.DnsMapRules_7]);
                }
                if(data.DnsMapRules_8 != ""){
                    rules.push([9,data.DnsMapRules_8]);
                }
                if(data.DnsMapRules_9 != ""){
                    rules.push([10,data.DnsMapRules_9]);
                }
                result.dnsMapRules = parseDnsMapRules(rules);
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    function parseDnsMapRules(data) {
        var rules = [];
        if(data && data.length > 0){
            for(var i = 0; i < data.length; i++){
                var aRule = {};
                aRule.index = data[i][0];
                aRule.dnsRule = data[i][1];
                rules.push(aRule);
            }
        }
        return rules;
    }
    /**
     * 设置DNS信息
     * @method setDnsMap
     */
    function setDnsMap() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "ADD_DNS_MAP";
            requestParams.dnsRule = params.dnsRule;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 删除DNS信息
     * @method deleteDnsRule
     */
    function deleteDnsRule() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "DEL_DNS_MAP";
            requestParams.delete_dns = params.indexs;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }  
    

    /**
     * 获取流量提醒数据
     * @method getTrafficAlertInfo
     */
    function getTrafficAlertInfo() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            return {
                isTest : isTest,
                cmd : "data_volume_limit_switch,exceeds_alert_switch,date_clear_type_checked,data_volume_limit_unit,data_volume_limit_size,data_volume_alert_percent,date_clear_switch,date_clear_zero",
                multi_data : 1
            };
        }

        function deal(data) {
            if (data) {
                var isData = data.data_volume_limit_unit == 'data';
                var result = {
                	  dateclearchecked : data.date_clear_switch,     //  流量清零日期设置启用或禁用
                	  selectedtimeUnit : data.date_clear_zero,     //清零日期 选择的每月的清零日期
                    dataLimitChecked : data.data_volume_limit_switch,  //  流量限制 启用或停用
                    dataLimitTypeChecked : isData ? '1' : '0',     //限制方式 流量或时间
					dateclearTypeChecked  : data.date_clear_type_checked,     //清零方式 每月或每日
                    limitDataMonth : isData ? data.data_volume_limit_size : '0',      //每月限制的流量额和单位（MB,GB,TB）
                    alertDataReach : isData ? data.data_volume_alert_percent : '0',   //流量超出百分比提示
                    limitTimeMonth : isData ? '0' : data.data_volume_limit_size,         //每月限制的时间额
                    alertTimeReach : isData ? '0' : data.data_volume_alert_percent,    //时间超出百分比提示
					exhaustedAlertChecked : data.exceeds_alert_switch

                };
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置流量提醒
     * @method setTrafficAlertInfo
     */
    function setTrafficAlertInfo(){
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var isData = params.dataLimitTypeChecked == '1';
            var requestParams = {
                isTest : isTest,
                goformId : "DATA_LIMIT_SETTING",
                data_volume_limit_switch: params.dataLimitChecked,    //流量限制启用 1 ，禁用 0
                date_clear_switch : params.dateclearChecked,    //流量清零启用 1 ，禁用 0
				date_clear_type_checked : params.dateclearTypeChecked,  //清零方式 1 按月清零 0 按日清零
                date_clear_zero : params.cleardate,  //按月清零日期设置
		        exceeds_alert_switch : params.exceedsAlertChecked,  
            };
            if(params.dataLimitChecked == '1'){
                requestParams.data_volume_limit_unit = isData ? 'data' : 'time';
                requestParams.data_volume_limit_size = isData ? params.limitDataMonth : params.limitTimeMonth;
                requestParams.data_volume_alert_percent = isData ? params.alertDataReach : params.alertTimeReach;
				if(params.dateclearTypeChecked == '0'){
					requestParams.data_volume_limit_unit = 'data';
				}
            }

            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 发送USSD命令，获取响应
     * @method getUSSDResponse
     */
    function getUSSDResponse(){
        var callback = arguments[1];
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            if(params.sendOrReply=="send"){
                return {
                    isTest : isTest,
                    goformId : "USSD_PROCESS",
                    USSD_operator : params.operator,
                    USSD_send_number : params.strUSSDCommand,
                    notCallback : true
                };
            }else if(params.sendOrReply=="reply"){
                return {
                    isTest : isTest,
                    goformId : "USSD_PROCESS",
                    USSD_operator: params.operator,
                    USSD_reply_number: params.strUSSDCommand,
                    notCallback : true
                };
            }
        }

        function deal(data) {
           if(!data){
                callback(false, "ussd_fail");
                return;
            }
            if (data.result == "success") {
                callbackTemp=callback;
                getResponse();
            } else {
                callback(false, "ussd_fail");
            }
        }

    }

    /**
     * 获取响应
     * @method getResponse
     */
    function getResponse(){
        $.ajax({
            url : "/goform/goform_get_cmd_process",
            data: {cmd : "ussd_write_flag"},
            cache: false,
            async: false,
            dataType: "json",
            success: function(result){
                if (result.ussd_write_flag == "1" ) {
                    callbackTemp(false, "ussd_no_service");
                }else if (result.ussd_write_flag == "4" || result.ussd_write_flag == "unknown") {
                    callbackTemp(false, "ussd_timeout");
                }else if (result.ussd_write_flag == "15") {
                    setTimeout(getResponse, 1000);
                }else if (result.ussd_write_flag == "10") {
                    callbackTemp(false, "ussd_retry");
                }else if (result.ussd_write_flag == "99") {
                    callbackTemp(false, "ussd_unsupport");
                }  else if (result.ussd_write_flag == "16") {
                    $.ajax({
                        url : "/goform/goform_get_cmd_process",
                        data : {cmd : "ussd_data_info"},
                        dataType : "json",
                        async : false,
                        cache : false,
                        success : function(data) {
                            var content ={};
                            content.data = data.ussd_data;
                            content.ussd_action = data.ussd_action;
                            callbackTemp(true, content);
                        },
                        error:function(){
                            callbackTemp(false, "ussd_info_error");
                        }
                    });
                }else{
                    callbackTemp(false, "ussd_fail");
                }
            },
            error: function(){
                callbackTemp(false, "ussd_fail");
            }
        });
    }

    /**
     * 发送USSD取消命令
     * @method USSDReplyCancel
     */
    function USSDReplyCancel(callback){
        $.ajax({
            url : "/goform/goform_set_cmd_process",
            data: {goformId : "USSD_PROCESS", USSD_operator: "ussd_cancel"},
            cache: false,
            dataType: "json",
            success : function(data) {
                if (data.result == "success") {
                    getCancelResponse();
                }else{
                    callback(false);
                }
            }
        });

        function getCancelResponse(){
            $.ajax({
                url : "/goform/goform_get_cmd_process",
                data: {cmd : "ussd_write_flag"},
                cache: false,
                async: false,
                dataType: "json",
                success: function(result){
                    if (result.ussd_write_flag == "15") {
                        setTimeout(getCancelResponse, 1000);
                    } else if (result.ussd_write_flag == "13") {
                        callback(true);
                    } else{
                        callback(false);
                    }
                },
                error: function(){
                    callback(false);
                }
            });
        }
    }
    /**
     *获取STK信息
     * @method getSTKFlagInfo
     */
    function getSTKFlagInfo() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "stk_write_flag";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.stk_write_flag = data.stk_write_flag;
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }
    
    /**
     *获取STK信息
     * @method getSTKInfo
     */
    function getSTKInfo() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "stk";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.stk = data.stk;
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }    
    
    /**
     *获取STKmenu信息
     * @method getSTKMenuInfo
     */
    function getSTKMenuInfo() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "stk_menu";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {};
                result.stk_menu = data.stk_menu;
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }    
    
    /**
     *设置stk信息
     * @method setSTKMenuInfo
     */
    function setSTKMenuInfo() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.goformId = "STK_PROCESS";
            requestParams.isTest = isTest;
            requestParams.operator = params.operator;
            requestParams.item_no = params.item_no;
            requestParams.stk_content = params.stk_content;
            requestParams.stk_encode_type = params.stk_encode_type;            
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }


    /**
     * 获取dlna参数
     * @method getDlnaSetting
     */
    function getDlnaSetting() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "dlna_language,dlna_name,dlna_share_audio,dlna_share_video,dlna_share_image,dlna_scan_state,sd_card_state,sdcard_mode_option,sdcard_select";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {
                    language : data.dlna_language,
                    deviceName : data.dlna_name,
                    shareAudio : data.dlna_share_audio,
                    shareVideo : data.dlna_share_video,
                    shareImage : data.dlna_share_image,
                    needRescan: data.dlna_scan_state == "1",
                    dlnaEnable: data.sd_card_state == "1" && data.sdcard_mode_option == "1"
                };
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置dlna参数
     * @method setDlnaSetting
     */
    function setDlnaSetting() {
        var callback = arguments[1];
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            return {
                isTest : isTest,
                notCallback: true,
                goformId : "DLNA_SETTINGS",
                dlna_language: params.language,
                dlna_name: params.deviceName,
                dlna_share_audio: params.shareAudio,
                dlna_share_video: params.shareVideo,
                dlna_share_image: params.shareImage
            };
        }

        function deal(data) {
            if (data && data.result == "success") {
                addTimerThings("dlna_rescan_end", checkSetDlnaSetting);
            } else {
                callback(data);
            }
        }

        function checkSetDlnaSetting(data){
            checkRescanStatus(data, callback, checkSetDlnaSetting);
        }
    }

    /**
     * 重新扫描dlna, 使共享文件与T卡文件同步
     * @method rescanDlna
     */
    function rescanDlna() {
        var callback = arguments[1];
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            return {
                isTest : isTest,
                notCallback: true,
                goformId : "DLNA_RESCAN"
            };
        }

        function deal(data) {
            if (data && data.result == "success") {
                addTimerThings("dlna_rescan_end", checkRescanDlna);
            } else {
                callback(data);
            }
        }

        function checkRescanDlna(data){
            checkRescanStatus(data, callback, checkRescanDlna);
        }
    }

    function checkRescanStatus(data, callback, fn) {
        if (data.dlna_rescan_end == "1") {
            removeTimerThings("dlna_rescan_end", fn);
            callback({result:"success"});
        }
    }

    /**
     * 网络解锁
     * @method unlockNetwork
     */
    function unlockNetwork() {
        var callback = arguments[1];
        var checkPoint = 0;
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params) {
            return {
                isTest: isTest,
                goformId: "UNLOCK_NETWORK",
                notCallback: true,
                unlock_network_code: params.unlock_network_code
            };
        }

        function deal(data) {
            if (data && data.result == "success") {
                addCallback(checkUnlockNetworkStatus);
            } else {
                callback({result: 'fail'});
            }
        }

        function checkUnlockNetworkStatus() {
            if (checkPoint > 5) {
                removeCallback(checkUnlockNetworkStatus);
                callback({result: 'fail'});
            } else if (timerInfo.simStatus != 'modem_imsi_waitnck') {
                removeCallback(checkUnlockNetworkStatus);
                callback({result: 'success'});
            } else {
                setTimeout(function () {
                    checkUnlockNetworkStatus();
                }, 1000);
            }
            checkPoint++;
        }
    }

    /**
     * 获取解锁次数
     * @method getNetworkUnlockTimes
     */
    function getNetworkUnlockTimes() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            return {
                isTest:isTest,
                cmd:"unlock_nck_time"
            };
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置升级提醒信息
     * @method setUpdateInfoWarning
     */
    function setUpdateInfoWarning(){
        var callback = arguments[1];
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params) {
            return {
                isTest : isTest,
                goformId : "SET_UPGRADE_NOTICE",
                upgrade_notice_flag : params.upgrade_notice_flag,
                notCallback : true
            };
        }

        function deal(data) {
            if (data.result=="success") {
                callback(true);
            } else {
                callback(false);
            }
        }
    }

    /**
     * 获取升级提醒信息
     * @method getUpdateInfoWarning
     */
    function getUpdateInfoWarning(){
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            return {
                isTest:isTest,
                cmd:"upgrade_notice_flag"
            };
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取AP Station基本设置
     * @method getAPStationBasic
     */
    function getAPStationBasic() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            return {
                isTest:isTest,
                multi_data:1,
                cmd:"wifi_sta_connection,ap_station_mode"
            };
        }

        function deal(data) {
            if (data) {
                return {
                    ap_station_enable:data.wifi_sta_connection,
                    ap_station_mode:data.ap_station_mode
                }
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取AP Station基本设置
     * @method setAPStationBasic
     */
    function setAPStationBasic() {
        var parameters = arguments[0];
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params) {
            return {
                isTest:isTest,
                goformId:"WIFI_STA_CONTROL",
                wifi_sta_connection:params.ap_station_enable,
                ap_station_mode:params.ap_station_mode
            };
        }

        function deal(data) {
            if (data && data.result == "success") {
                timerInfo.ap_station_enable = parameters.ap_station_enable == 1;
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 刷新AP Station使能状态到缓存
     * @method refreshAPStationStatus
     * @returns {getAPStationBasic|*}
     */
    function refreshAPStationStatus() {
        return getAPStationBasic({}, function(data){
            timerInfo.ap_station_enable = data.ap_station_enable == 1;
        });
    }

    /**
     * 获取预置和保存的热点列表
     * @method getHotspotList
     */
    function getHotspotList() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            return {
                isTest:isTest,
                multi_data:1,
                cmd:"wifi_profile,wifi_profile1,wifi_profile2,wifi_profile3,wifi_profile4,wifi_profile5,wifi_profile_num"
            };
        }

        function deal(data) {
            if (data) {
                var wifiList = [];
                for (var i = 0; i <= 5; i++) {
                    var wifiStr = "";
                    if (i == 0) {
                        wifiStr = data.wifi_profile;
                    } else {
                        wifiStr = data["wifi_profile" + i];
                    }
                    var wifiArray = wifiStr.split(";");
                    for (var j = 0; j < wifiArray.length; j++) {
                        var item = wifiArray[j].split(",");
                        if (!item[0]) {
                            break;
                        }
                        var wifiJson = {
                            profileName:item[0],
                            fromProvider:item[1],
                            connectStatus:item[2],
                            signal:item[3],
                            ssid:item[4],
                            authMode:item[5],
                            encryptType:item[6],
                            password:item[7]=="0"?"":item[7],
                            keyID:item[8]
                        }
                        wifiList.push(wifiJson);
                    }
                }

                return { hotspotList:wifiList };

            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 搜索热点
     * @method searchHotspot
     */
    function searchHotspot() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params) {
            return {
                isTest:isTest,
                goformId:"WLAN_SET_STA_REFRESH"
            };
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取搜寻到的热点列表
     * @method getSearchHotspotList
     */
    function getSearchHotspotList() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            return {
                isTest:isTest,
                multi_data:1,
                cmd:"scan_finish,EX_APLIST,EX_APLIST1"
            }
        }

        function deal(data) {
            if (data) {
                if (data.scan_finish == "0") {
                    return { scan_finish:false, hotspotList:[] };
                }
                var wifiList = [];
                for (var i = 0; i <= 1; i++) {
                    var wifiStr;
                    if (i == 0) {
                        wifiStr = data.EX_APLIST;
                    } else {
                        wifiStr = data.EX_APLIST1;
                    }
                    var wifiArray = wifiStr.split(";");
                    for (var j = 0; j < wifiArray.length; j++) {
                        var item = wifiArray[j].split(",");
                        if (!item[0]) {
                            break;
                        }
                        var wifiJson = {
                            fromProvider:item[0],
                            connectStatus:item[1],
                            ssid:item[2],
                            signal:item[3],
                            channel:item[4],
                            authMode:item[5],
                            encryptType:item[6]
                        }
                        wifiList.push(wifiJson);
                    }
                }

                return {scan_finish:true, hotspotList:wifiList };

            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 将热点信息组成字符串
     * @method creatHotspotString
     */
    function creatHotspotString(hotspot) {
        var item = [];
        item.push(hotspot.profileName);
        item.push(hotspot.fromProvider || "0");
        item.push(hotspot.connectStatus || "0");
        item.push(hotspot.signal);
        item.push(hotspot.ssid);
        item.push(hotspot.authMode);
        item.push(hotspot.encryptType);
        item.push(hotspot.password || "0");
        item.push(hotspot.keyID);
        return item.join(",");
    }

    /**
     * 保存热点
     * @method saveHotspot
     */
    function saveHotspot() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params) {
            var apList = params.apList;
            var action = "modify";
            if (params.profileName == "") {
                action = "add";
                var newName = ( jQuery.fn.jquery + Math.random() ).replace(/\D/g, "");
                params.profileName = newName;
                apList.push({
                    profileName:newName,
                    fromProvider:"0",
                    connectStatus:"0",
                    signal:params.signal,
                    ssid:params.ssid,
                    authMode:params.authMode,
                    encryptType:params.encryptType,
                    password:params.password || "0",
                    keyID:params.keyID
                });
            }

            var wifi = {"profile0":[], "profile1":[], "profile2":[], "profile3":[], "profile4":[], "profile5":[]};
            var activeHotspotStr = "";
            for (var i = 0; i < apList.length; i++) {
                var hotspotStr = "";
                if (params.profileName == apList[i].profileName) {
                    hotspotStr = creatHotspotString(params);
                    activeHotspotStr = hotspotStr;
                } else {
                    hotspotStr = creatHotspotString(apList[i]);
                }
                var index = parseInt(i / 5);
                wifi["profile" + index].push(hotspotStr);
            }

            return {
                isTest:isTest,
                goformId:"WIFI_SPOT_PROFILE_UPDATE",
                wifi_profile:wifi.profile0.join(";"),
                wifi_profile1:wifi.profile1.join(";"),
                wifi_profile2:wifi.profile2.join(";"),
                wifi_profile3:wifi.profile3.join(";"),
                wifi_profile4:wifi.profile4.join(";"),
                wifi_profile5:wifi.profile5.join(";"),
                wifi_profile_num:apList.length,
                wifi_update_profile:activeHotspotStr,
                action:action
            };
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 删除热点
     * @method deleteHotspot
     */
    function deleteHotspot() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params) {
            var apList = params.apList;
            var wifi = {"profile0":[], "profile1":[], "profile2":[], "profile3":[], "profile4":[], "profile5":[]};
            var foundDelete = false;
            var activeHotspotStr = "";
            for (var i = 0; i < apList.length; i++) {
                var hotspotStr = creatHotspotString(apList[i]);
                if (apList[i].profileName == params.profileName) {
                    foundDelete = true;
                    activeHotspotStr = hotspotStr;
                    continue;
                }
                var idIndex = i;
                if (foundDelete) {
                    idIndex = i - 1;
                }
                var index = parseInt(idIndex / 5);
                wifi["profile" + index].push(hotspotStr);
            }
            var num = foundDelete ? apList.length - 1 : apList.length;

            return {
                isTest:isTest,
                goformId:"WIFI_SPOT_PROFILE_UPDATE",
                wifi_profile:wifi.profile0.join(";"),
                wifi_profile1:wifi.profile1.join(";"),
                wifi_profile2:wifi.profile2.join(";"),
                wifi_profile3:wifi.profile3.join(";"),
                wifi_profile4:wifi.profile4.join(";"),
                wifi_profile5:wifi.profile5.join(";"),
                wifi_profile_num:num,
                wifi_update_profile:activeHotspotStr,
                action:"delete"
            };
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 链接热点
     * @method connectHotspot
     */
    function connectHotspot() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params) {
            return {
                isTest:isTest,
                goformId:"WLAN_SET_STA_CON",
                EX_SSID1:params.EX_SSID1,
                EX_AuthMode:params.EX_AuthMode,
                EX_EncrypType:params.EX_EncrypType,
                EX_DefaultKeyID:params.EX_DefaultKeyID,
                EX_WEPKEY:params.EX_WEPKEY,
                EX_WPAPSK1:params.EX_WPAPSK1,
                EX_wifi_profile:params.EX_wifi_profile
            };
        }

        function deal(data) {
            if (data && data.result == "success") {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 断开热点
     * @method disconnectHotspot
     */
    function disconnectHotspot() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params) {
            return {
                isTest:isTest,
                goformId:"WLAN_SET_STA_DISCON"
            };
        }

        function deal(data) {
            if (data && data.result == "success") {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取快速开机设置
     * @method getFastbootSetting
     */
    function getFastbootSetting() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params) {
            return {
                isTest:isTest,
                cmd:"mgmt_quicken_power_on"
            };
        }

        function deal(data) {
            return {fastbootEnabled: data.mgmt_quicken_power_on == '1' ? '1' : '0'};
        }
    }

    /**
     * 设置快速开机信息
     * @method setFastbootSetting
     */
    function setFastbootSetting() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params) {
            return {
                isTest:isTest,
                goformId:"MGMT_CONTROL_POWER_ON_SPEED",
                mgmt_quicken_power_on : params.fastbootEnabled
            };
        }

        function deal(data) {
            if (data && data.result == "success") {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

  /**
     * Date Setting 设置
     * @method setSntpSetting
     * @return {Object}
     */
    function setSntpSetting(){
        return doStuff(arguments,{},prepare,deal,null,true);
        function prepare(params,isPost){
            var requestParams = {};
            requestParams = $.extend({
                isTest:isTest
            }, params);
            return requestParams;
        }
        function deal(data){
            if( data && data.result == "success"){
                return { result : true };
            }else{
                return { result : false};
            }
        }
    }
    /**
     * 获取时间
     * @method getSntp
     * @return {Object} device JSON 对象
     */
    function getSntp() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "date_mode,timezone,sntp_year,sntp_month_temp,sntp_day,sntp_hour,sntp_minute,sntp_second,run_duration";
            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {
					          dateMode: data.date_mode,
					          timezone: data.timezone,
                    sntp_year:data.sntp_year,
                    sntp_month : data.sntp_month_temp,
                    sntp_day : data.sntp_day,
                    sntp_hour : data.sntp_hour,
                    sntp_minute : data.sntp_minute,
                    sntp_second : data.sntp_second,
                    run_duration: data.run_duration
                };
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 重启设备
     * @method restart
     */
    function restart() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "REBOOT_DEVICE";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }
    
    function enterLan() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "ENTER_LAN";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }
    
     /**
     * 获取OTA新版本信息
     * @method getNewVersionState
     * @return {Object} JSON 对象
     */
    function  getNewVersionState() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "new_version_state";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var hasNewVersion = (data.new_version_state == "1" || data.new_version_state == 'version_has_new_critical_software' || data.new_version_state == 'version_has_new_optional_software');
                data.hasNewVersion = hasNewVersion;
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }


    /**
     * 获取OTA新版本信息
     * @method getPackSizeInfo
     * @return {Object} JSON 对象
     */
    function  getNewVersionInfo() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "update_info";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取OTA强制升级状态
     * @method getMandatory
     * @return {Object} JSON 对象
     */
    function  getMandatory() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            if (config.UPGRADE_TYPE == "OTA") {
                requestParams.cmd = "is_mandatory";
            } else {
                requestParams.cmd = "new_version_state";
            }
            return requestParams;
        }

        function deal(data) {
            if (data) {
                if (config.UPGRADE_TYPE == "OTA") {
                    return {"is_mandatory": data.is_mandatory == "1"};
                } else {
                    return {"is_mandatory": data.new_version_state == "version_has_new_critical_software"};
                }
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取OTA升级结果
     * @method getUpgradeResult
     * @return {Object} JSON 对象
     */
    function  getUpgradeResult() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "upgrade_result";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }
        /**
     * 获取OTA升级状态
     * @method getCurrentUpgradeState
     * @return {Object} JSON 对象
     */
    function  getCurrentUpgradeState() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "current_upgrade_state";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取OTA下载状态
     * @method getPackSizeInfo
     * @return {Object} JSON 对象
     */
    function  getPackSizeInfo() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "pack_size_info";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取OTA选择状态
     * @method getUserChoice
     * @return {Object} JSON 对象
     */
    function  getUserChoice() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "if_has_select";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }



    /**
     *用户选择是否进行升级和升级中取消
     * @method setUpgradeSelectOp
     */
    function setUpgradeSelectOp() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.goformId = "IF_UPGRADE";
            requestParams.isTest = isTest;
            requestParams.select_op = params.selectOp;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }
    function getOTAUpdateSetting() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "GetUpgAutoSetting";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return {
                    "updateMode":data.UpgMode,
                    "updateIntervalDay":data.UpgIntervalDay,
                    "allowRoamingUpdate":data.UpgRoamPermission
                };
            } else {
                return unknownErrorObject;
            }
        }
    }

    function setOTAUpdateSetting() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "SetUpgAutoSetting";
            requestParams.UpgMode = params.updateMode;
            requestParams.UpgIntervalDay = params.updateIntervalDay;
            requestParams.UpgRoamPermission = params.allowRoamingUpdate;

            return requestParams;
        }

        function deal(data) {
            if (data && data.result == "success") {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }

    function clearUpdateResult(){
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "RESULT_RESTORE";
            return requestParams;
        }

        function deal(data) {
            if (data && data.result == "success") {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }
    
  function getIPprotoInfo() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "ipv4v6mode,ipv6_mtu,mtu_edit,addrconfig,pdp_type";

            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {
                    pdpType: data.pdp_type == 'IP'? 'IPv4':data.pdp_type == 'IPv4v6'? 'IPv4 & IPv6':data.pdp_type,
                    ipv4v6mode:data.ipv4v6mode,
                    ipv6_mtu:data.ipv6_mtu,
                    mtu_edit:data.mtu_edit,
                    addrconfig:data.addrconfig
                };
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }
     
   function setIPprotoInfo() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "SET_IPV6";
            requestParams.ipv4v6mode = params.ipv4v6mode;
            requestParams.ipv6_mtu = params.ipv6_mtu;
            requestParams.mtu_edit = params.mtu_edit;
            requestParams.addrconfig = params.addrconfig;
            return requestParams;
        }

        function deal(data) {
            if (data && data.result == "success") {
                 return {
                    result : true
                };
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 获取有线联网信息
     * @method getEthernetInfo
     * @return {Object} wifi JSON 对象
     */
    function getEthernetInfo() {
        return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.cmd = "cable_dial_mode,cable_static_wan_ipaddr," +
                "cable_static_wan_netmask,cable_static_wan_gateway,cable_static_prefer_dns," +
                "cable_dhcp_wan_ipaddr,cable_status,pppoe_username,pppoe_password," +
                "cable_auto_connect,rj45_mode";

            requestParams.multi_data = 1;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                var result = {
                    rj45_mode:data.rj45_mode,
                    cable_dial_mode:data.cable_dial_mode,
                    cable_static_wan_ipaddr:data.cable_static_wan_ipaddr,
                    cable_static_wan_netmask:data.cable_static_wan_netmask,
                    cable_static_wan_gateway:data.cable_static_wan_gateway,
                    cable_static_prefer_dns:data.cable_static_prefer_dns,
                    cable_dhcp_wan_ipaddr:data.cable_dhcp_wan_ipaddr,
                    cable_status:data.cable_status,
                    pppoe_username:data.pppoe_username,
                    pppoe_password:data.pppoe_password,
                    cable_auto_connect:data.cable_auto_connect,
                };
                return result;
            } else {
                return unknownErrorObject;
            }
        }
    }

    /**
     * 设置有线模式信息
     * @method setEthernetInfo
     * @param {Object} JSON 参数对象
     * @return {Object}
     */
    function checkEthConnectedStatus(currentConnStatus) {
        return currentConnStatus == "ppp_connected" || currentConnStatus == "ipv6_connected" || currentConnStatus == "ipv4_ipv6_connected";
    }

    function setEthernetInfo() {
        var cable_status = arguments[0].cable_status;
        var cable_dial_mode = arguments[0].cable_dial_mode;
        var callback = arguments[1];
        doStuffAndCheckServerIsOnline(arguments, prepare, deal);

        function prepare(params) {
            var requestParams = {
                goformId:"CABLE_CONFIG",
                isTest:isTest,
                notCallback: true,
                cable_dial_mode:params.cable_dial_mode,
                cable_static_wan_ipaddr:params.cable_static_wan_ipaddr,
                cable_static_wan_netmask:params.cable_static_wan_netmask,
                cable_static_wan_gateway:params.cable_static_wan_gateway,
                cable_static_prefer_dns:params.cable_static_prefer_dns,
                pppoe_username:params.pppoe_username,
                pppoe_password:params.pppoe_password,
                cable_auto_connect:params.cable_auto_connect,
            };
            debug(requestParams)
            return requestParams;
        }

        function deal(data) {
            if (data) {
                if (cable_dial_mode == "pppoe") {
                    addTimerThings("cable_status", checkEthConnectStatus);
                } else {
                    return data;
                }
            } else {
                return unknownErrorObject;
            }
        }

        function checkEthConnectStatus(data) {
            if (cable_status == "pppoe_connected") {
                if (data.cable_status == "cable_disconnected") {
                    removeTimerThings("cable_status", checkEthConnectStatus);
                    callback({
                        result : 'success'
                    });
                }
            } else {
                if (data.cable_status == "pppoe_connected") {
                    removeTimerThings("cable_status", checkEthConnectStatus);
                    callback({
                        result : 'success'
                    });
                }
            }
        }
    }

    /*
    *
    *
    */
    function getEthernetConnect(){
         return doStuff(arguments, {}, prepare, deal, null, false);

        function prepare(params, isPost) {
            return {
                isTest:isTest,
                multi_data:1,
                cmd:"rj45_mode,cable_status"
            };
        }

        function deal(data) {
            if (data) {
                return {
                    rj45_mode: data.rj45_mode,
                    cable_status: data.cable_status
                }
            } else {
                return unknownErrorObject;
            }
        }
    }
    
    /**
     * 删除所有日志
     * @method deleteLogs
     */
    function deleteLogs() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "SYSLOGS_DEL";
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }


    /**
     * 启动日志，创建日志目录
     * @method createLogDir
     */
    function createLogDir() {
        return doStuff(arguments, {}, prepare, deal, null, true);

        function prepare(params, isPost) {
            var requestParams = {};
            requestParams.isTest = isTest;
            requestParams.goformId = "LOGDIR_CREATE";
            requestParams.flag = params.flag;
            return requestParams;
        }

        function deal(data) {
            if (data) {
                return data;
            } else {
                return unknownErrorObject;
            }
        }
    }


    return {
        getEthernetConnect : getEthernetConnect,
        getWifiBasic : getWifiBasic,//Test Done
        setWifiBasic : setWifiBasic,//Test Done
        getWanBasic : getWanBasic,//Test Done
        setWanBasic : setWanBasic,//Test Done
        getEthernetInfo : getEthernetInfo,//Test Done
        setEthernetInfo : setEthernetInfo,//Test Done
        setWifiBasic4SSID2:setWifiBasic4SSID2,//Test Done
        setWifiBasicMultiSSIDSwitch:setWifiBasicMultiSSIDSwitch,//Test Done
        getSecurityInfo : getSecurityInfo,//Test Done
        setSecurityInfo : setSecurityInfo,//Test Done
        getCurrentlyAttachedDevicesInfo : getCurrentlyAttachedDevicesInfo,//Test Done
        getLanguage : getLanguage,//Test Done
        setLanguage : setLanguage,//Test Done
        getNetSelectInfo : getNetSelectInfo,//Test Done
        setBearerPreference : setBearerPreference,//Test Done
        scanForNetwork : scanForNetwork,//No Test
        getConnectionInfo : getConnectionInfo,//Test Done
        getStatusInfo : getStatusInfo,//Test Done
        connect : connect,//No Test
        disconnect : disconnect,//No Test
        setNetwork : setNetwork,//Test Done
        getCurrentNetwork : getCurrentNetwork,//Test Done
        savePhoneBook : savePhoneBook,//Test Done
        deletePhoneBooks :deletePhoneBooks,//Test Done
        deleteAllPhoneBooks:deleteAllPhoneBooks, //Test Done
        deleteAllPhoneBooksByGroup:deleteAllPhoneBooksByGroup,//Test Done
        getDevicePhoneBooks : getDevicePhoneBooks,//Test Done
        getSIMPhoneBooks : getSIMPhoneBooks,//Test Done
        getPhoneBooks : getPhoneBooks,//Test Done
        getPhoneBookReady: getPhoneBookReady,//Test Done
        getPhoneBooksByGroup: getPhoneBooksByGroup,//Test Done
        getConnectionMode: getConnectionMode,//Test Done
        setConnectionMode: setConnectionMode,//Test Done
        getApnSettings : getApnSettings,//Test Done
        deleteApn : deleteApn,//Test Done
        setDefaultApn : setDefaultApn,//Test Done
        addOrEditApn : addOrEditApn,//Test Done
        getSIMPhoneBookCapacity : getSIMPhoneBookCapacity,//Test Done
        getDevicePhoneBookCapacity : getDevicePhoneBookCapacity,//Test Done
        getLoginData:getLoginData,//Test Done
        login:login,//Test Done
        logout:logout,//Test Done
        getLoginStatus:getLoginStatus,//Test Done
        enterPIN:enterPIN,//Test Done
        enterPUK:enterPUK,//Test Done
        getSMSReady:getSMSReady,//Test Done
        getSMSMessages : getSMSMessages,//Test Done
        sendSMS : sendSMS,//Test Done
        saveSMS : saveSMS,//Test Done
        deleteAllMessages : deleteAllMessages,//Test Done
        deleteMessage : deleteMessage,//Test Done
        setSmsRead : setSmsRead,//Test Done
        resetNewSmsReceivedVar : resetNewSmsReceivedVar,
        resetSmsReportReceivedVar : resetSmsReportReceivedVar,
        getSMSDeliveryReport : getSMSDeliveryReport,
        getSmsCapability : getSmsCapability,//Test Done
        changePassword : changePassword,//Test Done
        getPinData : getPinData,//Test Done
        enablePin : enablePin,//Test Done
        disablePin : disablePin,//Test Done
        changePin : changePin,//Test Done
        getLanInfo: getLanInfo,//Test Done
        setLanInfo: setLanInfo,//Test Done
        getSmsSetting: getSmsSetting,//Test Done
        setSmsSetting: setSmsSetting,//Test Done
        restoreFactorySettings : restoreFactorySettings,//Test Done
        checkRestoreStatus : checkRestoreStatus,//Test Done
        getWpsInfo: getWpsInfo,//Test Done
        openWps: openWps,//Test Done
        getSleepMode: getSleepMode,//Test Done
        setSleepMode: setSleepMode,//Test Done
        getSysSecurity: getSysSecurity,//Test Done
        setSysSecurity: setSysSecurity,//Test Done
        getPortForward: getPortForward,//Test Done
        setPortForward: setPortForward,//Test Done
        deleteForwardRules: deleteForwardRules,//Test Done
        enableVirtualServer: enableVirtualServer,//Test Done
        getSDConfiguration: getSDConfiguration,//Test Done
        setSdCardMode: setSdCardMode,//Test Done
        checkFileExists: checkFileExists,//No Test
        getFileList: getFileList,//Test Done
        getDriverFileList:getDriverFileList,//add for 673
        fileRename: fileRename,//Test Done
        getSdMemorySizes : getSdMemorySizes,//Test Done
        deleteFilesAndFolders : deleteFilesAndFolders,//Test Done
        createFolder : createFolder,//Test Done
        checkUploadFileStatus : checkUploadFileStatus,//No Test
        setSdCardSharing:setSdCardSharing,//Test Done
        getQuickSettingInfo:getQuickSettingInfo,//Test Done
        setQuickSetting:setQuickSetting,//Test Done
        setQuickSetting4IPv6:setQuickSetting4IPv6, //Test Done
        getPortFilter: getPortFilter,//Test Done
        setPortFilterBasic: setPortFilterBasic,//Test Done
        setPortFilter: setPortFilter,//Test Done
        deleteFilterRules: deleteFilterRules,//Test Done
        getWifiAdvance: getWifiAdvance,//Test Done
        setWifiAdvance: setWifiAdvance,//Test Done
        getWifiRange: getWifiRange,//Test Done
        setWifiRange: setWifiRange,//Test Done
        getUpnpSetting: getUpnpSetting,//Test Done
        setUpnpSetting: setUpnpSetting,//Test Done
        getDmzSetting: getDmzSetting,//Test Done
        setDmzSetting: setDmzSetting,//Test Done
		getNatSetting: getNatSetting,//Test Done
        setNatSetting: setNatSetting,//Test Done
        getDeviceInfo: getDeviceInfo, //Test Done
        getConnectionStatus:getConnectionStatus,//cpf903
        getPortMap: getPortMap,//Test Done
        setPortMap: setPortMap,//Test Done
        enablePortMap: enablePortMap,//Test Done
        deleteMapRules: deleteMapRules, //Test Done
        getDnsMap: getDnsMap,//No Test
        setDnsMap: setDnsMap,//No Test
        deleteDnsRule: deleteDnsRule,//No Test
	 			getTrafficAlertInfo : getTrafficAlertInfo,//Test Done
        setTrafficAlertInfo : setTrafficAlertInfo,//Test Done
        getDlnaSetting: getDlnaSetting, //Test Done
        setDlnaSetting: setDlnaSetting, //Test Done
        rescanDlna: rescanDlna,//Test Done
        getUSSDResponse : getUSSDResponse,//No Test
        USSDReplyCancel : USSDReplyCancel,//No Test
        getNetworkUnlockTimes:getNetworkUnlockTimes,//No Test
        unlockNetwork : unlockNetwork,//No Test
        setUpdateInfoWarning : setUpdateInfoWarning,//No Test
        getUpdateInfoWarning : getUpdateInfoWarning,//No Test
        getAPStationBasic:getAPStationBasic,//Test Done
        setAPStationBasic:setAPStationBasic,//Test Done
        refreshAPStationStatus: refreshAPStationStatus,
        getHotspotList:getHotspotList,//Test Done
        searchHotspot:searchHotspot,//No Test
        getSearchHotspotList:getSearchHotspotList,//Test Done
        saveHotspot:saveHotspot,
        deleteHotspot:deleteHotspot,
        connectHotspot:connectHotspot,
        disconnectHotspot:disconnectHotspot,
        getFastbootSetting: getFastbootSetting,//Test Done
        setFastbootSetting: setFastbootSetting, //Test Done
        restart: restart,
        enterLan:enterLan,
        getSntp:getSntp,
        setSntpSetting:setSntpSetting,
        clearTrafficData: clearTrafficData,
        getSTKFlagInfo: getSTKFlagInfo,
        getSTKMenuInfo: getSTKMenuInfo,
        setSTKMenuInfo: setSTKMenuInfo,
        getSTKInfo: getSTKInfo,
        getNewVersionState:getNewVersionState,
        getUpgradeResult:getUpgradeResult,
        getCurrentUpgradeState:getCurrentUpgradeState,
        setUpgradeSelectOp:setUpgradeSelectOp,
        addTimerThings:addTimerThings,
        removeTimerThings:removeTimerThings,
        getPackSizeInfo:getPackSizeInfo,
        getNewVersionInfo:getNewVersionInfo,
        getMandatory:getMandatory,
        getUserChoice:getUserChoice,
        getOTAUpdateSetting:getOTAUpdateSetting,
        setOTAUpdateSetting:setOTAUpdateSetting,
        clearUpdateResult:clearUpdateResult,
        deleteLogs:deleteLogs,
        createLogDir:createLogDir,
        getIPprotoInfo:getIPprotoInfo,   ///fjj add
        setIPprotoInfo:setIPprotoInfo
    };
});
