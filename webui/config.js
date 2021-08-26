/**
 * 参数配置
 * @module config
 * @class config
 */
define(function() {
    var config = {
        IS_TEST: kthy_web_ui_is_test, //配置项在main.js顶部
        IS_SHOW_RF_PARA :false,
        HAS_LOGIN: true,//是否有登录页面
        defaultRoute: '#login',
        LOGIN_SECURITY_SUPPORT: true, //是否支持登录安全
        MAX_LOGIN_COUNT: 5,//最大登录次数，密码输入错误次数到了以后会账户冻结一定时间
        GUEST_HASH: ['#httpshare_guest'],
        THEME: 'mac',
        DEVICE: 'kfi/kf110',
        PASSWORD_ENCODE: true,//登录密码和WIFI密码是否加密
        HAS_MULTI_SSID: false,//多ssid功能
        HAS_WIFI: true,  //是否包含wifi功能
		HAS_WEP:false,  //wifi基本设置中安全模式是否包含wep
        HAS_BATTERY: true, //是否有电池
        SHOW_MAC_ADDRESS: true, //是否显示mac地址
		SHOW_NET_SYNC_TIME: false,//show NTP sync time set
		IPV6_SUPPORT: false, //是否支持ipv6
        USE_IPV6_INTERFACE:false,//使用IPV6相关新接口。使用方法，例如使用MF92时，设置为false。
        MAX_STATION_NUMBER: 10, //WIFI最大连接数
        NETWORK_UNLOCK_SUPPORT:true,//是否支持解锁
        WIFI_BAND_SUPPORT: false, //是否支持wifi频段设置
        WIFI_BANDWIDTH_SUPPORT: false, //是否支持频带宽度
        WIFI_SUPPORT_QR_CODE: false, //是否支持wifi二维码显示,新立MDM9x15、MDM9x25、MTK平台uFi项目上，默认支持WiFi二维码。
        UPGRADE_TYPE:"FOTA",//取值有"NONE","OTA","FOTA","TWO_PORTION"
        ALREADY_NOTICE:false,//是否已经提醒，有在线升级信息
        HAS_OTA_NEW_VERSION:false,//是否有OTA升级的新版本
        ALREADY_OTA_NOTICE:false,//是否OTA升级提醒过
        AP_STATION_SUPPORT:false,//是否支持AP Station功能
        AP_STATION_LIST_LENGTH:10,
        HAS_PHONEBOOK:true,//是否有电话本功能
        HAS_SMS:true,//是否有短信功能
        SMS_DATABASE_SORT_SUPPORT: true,//短信是否支持DB排序
        SHOW_UN_COMPLETE_CONCAT_SMS: true,//级联短信未接收完是否显示相关级联短信
        SMS_UNREAD_NUM_INCLUDE_SIM: false,//未读短息数量是否包含SIM侧
        SD_CARD_SUPPORT: false,//是否支持SD卡
        WEBUI_TITLE: '4G PRODUCT', //title配置, 具体参考各设备下的配置
        //modem_main_state的临时状态，一般需要界面轮询等待
        TEMPORARY_MODEM_MAIN_STATE:["modem_undetected", "modem_detected", "modem_sim_state", "modem_handover", "modem_imsi_lock", "modem_online", "modem_offline"],
        SHOW_APN_DNS:false,//APN设置页面是否显示DNS，不显示则dnsMode默认设置为auto
        CONTENT_MODIFIED:{
            modified:false,
            message:'leave_page_info',
            data:{},
            checkChangMethod:function () {
                return false;
            },
            callback:{ok:$.noop, no:function () {
                return true;
            }}//如果no返回true,页面则保持原状
        }, //当前页面内容是否已经修改

        resetContentModifyValue:function () {
            this.CONTENT_MODIFIED.checkChangMethod = function () {
                return false;
            };
            this.CONTENT_MODIFIED.modified = false;
            this.CONTENT_MODIFIED.message = 'leave_page_info';
            this.CONTENT_MODIFIED.callback = {ok:$.noop, no:function () {
                return true;
            }};//如果no返回true,页面则保持原状
            this.CONTENT_MODIFIED.data = {};
        },

        /**
         * 端口转发最大规则数
         * @attribute {Integer} portForwardMax
         */
        portForwardMax: 10,
        /**
         * Dns过滤最大规则数
         * @attribute {Integer} dnsMax
         */
        dnsMax: 10,
        /**
         * 出厂设置默认APN的个数
         * @attribute {Integer} defaultApnSize
         */
        defaultApnSize:1,
        /**
         * 最大APN个数
         * @attribute {Integer} maxApnNumber
         */
        maxApnNumber: 20,
        NETWORK_MODES : [ {
            name : '802.11 b/g/n',
            value : '4'
        }, {
            name : '802.11 n only',
            value : '2'
        } ],
        NETWORK_MODES_BAND : [ {
            name : '802.11 a only',
            value : '5'
        }, {
            name : '802.11 n only',
            value : '2'
        }, {
            name : '802.11 a/n',
            value : '4'
        } ],
        
        AUTH_MODES : [  {
            name: 'NO ENCRYPTION',
            value: 'OPEN'
        }, {
            name : 'WPA2-PSK(AES)',
            value : 'WPA2PSK'
        }/*,{
            name : 'WPA-PSK/WPA2-PSK(TKIP)',
            value : 'WPAPSKWPA2PSK'
        }*/],
        
        WAITTIMES : [  {
            name: '5',
            value: '5'
        }, {
            name : '10',
            value : '10'
        },{
            name : '0',
            value : '0'
        }],
        
        CONNECTIONTYPES : [  {
            name: '0',
            value: 'AUTO'
        }, {
            name : '1',
            value : 'PPPOE'
        },{
            name : '2',
            value : 'DynamicIP'
        },{
            name : '3',
            value : 'LAN'
        }],
        
	    WEP_MODES : [  {
            name: 'WEP-64bit',
            value: 'WEP-64bit-5ASIIC/10Hex'
        },{
            name : 'WEP-128bit',
            value : 'WEP-128bit-13ASIIC/26Hex'
        }],
        AUTH_MODES_ALL : [  {
            name: 'NO ENCRYPTION',
            value: 'OPEN'
        }, {
            name : 'SHARED',
            value : 'SHARED'
        }, {
            name : 'WPA-PSK',
            value : 'WPAPSK'
        }, {
            name : 'WPA2-PSK',
            value : 'WPA2PSK'
        }, {
            name : 'WPA-PSK/WPA2-PSK',
            value : 'WPAPSKWPA2PSK'
        } ],

        LANGUAGES: [ {
            name: 'English',
            value: 'en'
        },  {
            name: '中文',
            value: 'zh-cn'
        }, /*{
            name: 'Français',
            value: 'fr-FR'
        },{
            name: '中文繁體',
            value: 'zh-tw'
	},{
            name: ' русский язык',
            value: 'ru-RU'
        }*/ ],
        AUTO_MODES_6: [ {
            name: 'NETWORK_auto',
            value: '4G/3G/2G'
        }, {
            name: 'Only_WCDMA',
            value: '3G_Only'
        }, {
            name: 'Only_LTE',
            value: '4G_Only'
        } ],
        PREF_MODES_6 : [ {
       	    name:  'LTE_preferred',
            value: '4G_Priority'
        } ,{
           name:  'WCDMA_GSM_preferred',
           value: '3G_Priority'
        }],
		AUTO_MODES_5: [ {
            name: 'NETWORK_auto',
            value: '4G/3G/2G'
        }, {
            name: 'Only_GSM',
            value: '2G_Only'
        }, {
            name: 'Only_WCDMA',
            value: '3G_Only'
        }, {
            name: 'Only_LTE',
            value: '4G_Only'
        } ],
        PREF_MODES_5 : [ {
       	    name:  'LTE_preferred',
            value: '4G_Priority'
        } ,{
           name:  'WCDMA_GSM_preferred',
           value: '3G_Priority'
        }],
        APN_AUTH_MODES : [ {
            name : "NONE",
            value : "none"
        }, {
            name : "CHAP",
            value : "chap"
        }, {
            name : "PAP",
            value : "pap"
        } ],
        
        APN_CONNECT_MODES : [ {
            name : "IPV4",
            value : "ip"
        }, {
            name : "IPV6",
            value : "ipv6"
        }, {
            name : "IPV4V6",
            value : "ipv4v6"
        } ],
        
        SMS_VALIDITY: [ {
            name: '12 hours',
            value: 'twelve_hours'
        }, {
            name: 'A day',
            value: 'one_day'
        }, {
            name: 'A week',
            value: 'one_week'
        }, {
            name: 'The longest period',
            value: 'largest'
        }],
        SLEEP_MODES : [ {
            name : "Always on",
            value : "-1"
        }, {
            name : "10 minutes",
            value : "10"
        }, {
            name : "30 minutes",
            value : "30"
        }, {
            name : "1 hour",
            value : "60"
        }, {
            name : "2 hours",
            value : "120"
        } ],

        FORWARD_PROTOCOL_MODES: [ {
            name : "TCP+UDP",
            value : "TCP&UDP"
        }, {
            name : "TCP",
            value : "TCP"
        }, {
            name : "UDP",
            value : "UDP"
        }],

        MAP_PROTOCOL_MODES: [ {
            name : "TCP+UDP",
            value : "TCP&UDP"
        }, {
            name : "TCP",
            value : "TCP"
        }, {
            name : "UDP",
            value : "UDP"
        }],

        FILTER_PROTOCOL_MODES: [ {
            name : "NONE",
            value : "None"
        }, {
            name : "TCP",
            value : "TCP"
        }, {
            name : "UDP",
            value : "UDP"
        }, {
            name : "ICMP",
            value : "ICMP"
        }],

        SD_SHARE_ENABLE: [ {
            name : "Enable",
            value : "1"
        }, {
            name : "Disable",
            value : "0"
        }],

        SD_FILE_TO_SHARE: [ {
            name : "entire_sd_card",
            value : "1"
        }, {
            name : "custom_setting",
            value : "0"
        }],

        SD_ACCESS_TYPE: [ {
            name : "entire_sd_card",
            value : "1"
        }, {
            name : "custom_setting",
            value : "0"
        }],

        DLNA_LANGUAGES: [ {
            name: 'english',
            value: 'english'
        }, {
            name: 'chinese',
            value: 'chinese'
        }, /*{
            name: 'france',
            value: 'france'
        }*/
        /*{
            name: 'russian',
            value: 'russian'
        }*/ 
        ],

        /**
         * RJ45 /rj45/目录
         * @attribute {String} SD_BASE_PATH
         */
        EthernetDialMode : [  {
            name: 'PPPOE',
            value: 'pppoe'
        }, {
            name : 'Static',
            value : 'static'
        },{
            name : 'DHCP',
            value : 'dhcp'
        } ],

        /**
         * SD 卡根目录
         * @attribute {String} SD_BASE_PATH 
         */
        //SD_BASE_PATH: '/mmc2',
        SD_BASE_PATH: '/',
        
        DRIVER_BASE_PATH:'',

        /**
         * 数据库中全部的短消息
         * @attribute {Array} dbMsgs 
         */
        dbMsgs : [],
        /**
         * 经解析关联后的所有短消息
         * @attribute {Array} listMsgs 
         */
        listMsgs : [],

        /**
         * 当前聊天对象的手机号
         * @attribute {String} currentChatObject 
         */
        currentChatObject: null,
        /**
         * 短消息最大编号
         * @attribute {Integer} maxId 
         */
        smsMaxId : 0,
        /**
         *  电话本记录 
         * @attribute {Array} phonebook  
         * */
        phonebook : [],
        /**
         *  缓存短信初始化状态
         * @attribute {Boolean} smsIsReady
         * */
        smsIsReady: false,
        /**
         * 国家码所述类型
         * @attribute {JSON} defaultApnSize
         * @example
         * 2412-2462   1
         * 2467-2472   2
         * 2312-2372   4
         */
        countryCodeType : {
            world: 3,
            mkkc: 3,
            apld: 7,
            etsic: 3,
            fcca: 1
        },
        
        /**
         * 国家码与类型匹配表
         * @attribute {Map} countryCode
         */
        countryCode: {
            world: [ "AL", "DZ", "AR", "AM", "AU", "AT", "AZ", "BH", "BY",
                "BE", "BA", "BR", "BN", "BG", "CL", "CN", "CR", "HR", "CY",
                "CZ", "DK", "EC", "EG", "SV", "EE", "FI", "FR", "F2", "GE",
                "DE", "GR", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IE",
                "IL", "IT", "JM", "JO", "KZ", "KE", "KP", "KR", "KW", "LV",
                "LB", "LI", "LT", "LU", "MO", "MK", "MY", "MT", "MC", "MA",
                "NL", "AN", "NO", "OM", "PK", "PE", "PH", "PL", "PT", "QA",
                "RO", "RU", "SA", "CS", "SG", "SK", "SI", "ZA", "ES", "LK",
                "SE", "CH", "SY", "TH", "TT", "TN", "TR", "UA", "AE", "GB",
                "UY", "VN", "YE", "ZW", "BD", "NG"],
            mkkc: [ "JP" ],
            apld: [],
            etsic: [ "BZ", "BO", "NZ", "VE" ],
            fcca: [ "CA", "CO", "DO", "GT", "MX", "PA", "PR", "TW", "US", "UZ" ]
        },
        countryCode_5g: {
            //88 countries of world【36 40 44 48】
            one: {
                codes: [ "AL", "AI", "AW", "AT", "BY", "BM", "BA", "BW", "IO", "BG",
                    "CV", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "GF", "PF",
                    "TF", "GI", "DE", "GR", "GP", "GG", "HU", "IS", "IE", "IT",
                    "KE", "LA", "LV", "LS", "LI", "LT", "LU", "MK", "MT", "IM",
                    "MQ", "MR", "MU", "YT", "MC", "ME", "MS", "NL", "AN", "NO",
                    "OM", "PL", "PT", "RE", "RO", "SM", "SN", "RS", "SK", "SI",
                    "ZA", "ES", "SE", "CH", "TC", "UG", "GB", "VG", "WF", "ZM",
                    "AF", "JO", "MA", "EH", "EU", "DZ", "IL", "MX", "PM", "TN",
                    "TR", "JP" ],
                channels: [36, 40, 44, 48]},
            //60 countrys of world【36 40 44 48 149 153 157 161 165】
            two: {
                codes: [ "AS", "AG", "AZ", "BR", "KH", "KY", "CO", "CR", "DM", "DO",
                    "EC", "GH", "GD", "HK", "KZ", "KI", "FM", "MZ", "NA", "NZ",
                    "NI", "NE", "PW", "PE", "PH", "PR", "VC", "TH", "TT", "UY",
                    "ZW", "AU", "BH", "BB", "CA", "CL", "CX", "EG", "SV", "GT",
                    "HT", "IN", "MY", "NF", "PA", "PG", "SG", "US", "VN" ],
                channels: [36, 40, 44, 48, 149, 153, 157, 161, 165]},
            //9 countrys of world【149 153 157 161】
            three: {
                codes: ["CU", "IR", "KR", "SY", "LB", "MW", "MO", "QA"],
                channels: [149, 153, 157, 161]},
            //12 countrys of world【149 153 157 161 165】
            four: {
                codes: [ "BD", "BF", "CN", "HN", "JM", "PK", "PY", "KN", "AR", "TW", "NG" ],
                channels: [149, 153, 157, 161, 165]},
            //1 country of world【36 40 44 48 149 153 157 161】
            five: {
                codes: [ "SA" ],
                channels: [36, 40, 44, 48, 149, 153, 157, 161]}
        },

        /**
         * 国家码与语言匹配表
         * @attribute {Map} countries
         */
        countries: {
            NONE: "NONE",
          /*  AL: "SHQIPERI",
            DZ: "الجزائر",
            AR: "ARGENTIA",
            AM: "ՀԱՅԱՍՏԱՆ",*/
            AU: "AUSTRALIA",
           /* AT: "ÖSTERREICH",
            AZ: "AZƏRBAYCAN",
            BD: "BANGLADESH",
            BH: "البحرين",
            BY: "БЕЛАРУСЬ",
            BE: "BELGIË",
            BA: "БОСНА И ХЕРЦЕГОВИНА",
            BR: "BRASIL",
            BN: "BRUNEI DARUSSALAM",
            BG: "БЪЛГАРИЯ",
            CL: "CHILE",*/
            CN: "中国",
          /*  CR: "COSTA RICA",
            HR: "HRVATSKA",
            CY: "ΚΎΠΡΟΣ",
            CZ: "ČESKÁ REPUBLIKA",
            DK: "DANMARK",
            EC: "ECUADOR",
            EG: "مصر",
            SV: "EL SALVADOR",
            EE: "EESTI",
            FI: "SUOMI",
            FR: "FRANCE",
            F2: "FRANCE RESERVES",
            GE: "საქართველო",
            DE: "DEUTSCHLAND",
            GR: "ΕΛΛΆΔΑ",
            HN: "HONDURAS",*/
            HK: "香港",
         /*   HU: "MAGYARORSZÁG",
            IS: "ÍSLAND",
            IN: "INDIA",
            ID: "INDONESIA",
            IR: "ایران، جمهوری اسلامی",
            IE: "ÉIRE",
            IL: "إسرائيل",
            IT: "ITALIA",
            JM: "JAMAICA",
            JO: "الأردن",
            KZ: "КАЗАХСТАН",
            KE: "KENYA",
            KP: "조선민주주의인민공화국",
            KW: "الكويت",
            LV: "LATVIJA",
            LB: "لبنان",
            LI: "LIECHTENSTEIN",
            LT: "LIETUVA",
            LU: "LUXEMBOURG",*/
            MO: "澳門",
         /*   MK: "МАКЕДОНИЈА",
            MY: "MALAYSIA",
            MT: "MALTA",
            MC: "MONACO",
            MA: "المغرب",
            NL: "NEDERLAND",
            AN: "NETHERLANDS ANTILLES",
            NO: "NORGE",
            OM: "سلطنة عمان",
            PK: "PAKISTAN",
            PE: "PERÚ",
            PH: "PHILIPPINES",
            PL: "POLSKA",
            PT: "PORTUGAL",
            QA: "قطر",
            RO: "ROMÂNIA",*/
            RU: "Российская Федерация",
            /*SA: "السعودية",
            CS: "Црна Гора",
            SG: "SINGAPORE",
            SK: "SLOVENSKÁ REPUBLIKA",
            SI: "SLOVENIJA",
            ZA: "SOUTH AFRICA",
            ES: "ESPAÑA",
            LK: "SRI LANKA",
            SE: "SVERIGE",
            CH: "SCHWEIZ",
            SY: "الجمهورية العربية السورية",
            TH: "ประเทศไทย",
            TT: "TRINIDAD AND TOBAGO",
            TN: "تونس",
            TR: "TÜRKİYE",
            UA: "Україна",
            AE: "الإمارات العربية المتحدة",
            GB: "UNITED KINGDOM",
            UY: "URUGUAY",
            VN: "VIỆT NAM",
            YE: "اليمن",
            ZW: "ZIMBABWE",*/
            JP: "日本",
           /* BZ: "BELIZE",
            BO: "BOLIVIA",
            NZ: "NEW ZEALAND",
            VE: "REPÚBLICA BOLIVARIANA DE VENEZUELA",*/
            CA: "CANADA",
          /*  CO: "COLOMBIA",
            DO: "REPÚBLICA DOMINICANA",
            GT: "GUATEMALA",
            MX: "MEXICO",
            PA: "PANAMÁ",
            PR: "PUERTO RICO",*/
            TW: "台灣",
            NG: "NIGERIA",
            US: "UNITED STATES"/*,
            UZ: "O’zbekiston"*/
        },
        countries_5g: {
            NONE: "NONE",
         /*   AL: "SHQIPERI",
            AI: "ANGUILLA",
            AW: "ARUBA",
            AT: "ÖSTERREICH",
            BY: "БЕЛАРУСЬ",
            BM: "BERMUDA",
            BA: "БОСНА И ХЕРЦЕГОВИНА",
            BW: "BOTSWANA",
            IO: "BRITISH INDIAN OCEAN TERRITORY",
            BG: "БЪЛГАРИЯ",
            CV: "CAPE VERDE",
            HR: "HRVATSKA",
            CY: "ΚΎΠΡΟΣ",
            CZ: "ČESKÁ REPUBLIKA",
            DK: "DANMARK",
            EE: "EESTI",
            FI: "SUOMI",
            FR: "FRANCE",
            GF: "GUYANE FRANÇAISE",
            PF: "POLYNÉSIE FRANÇAISE",
            TF: "Terres australes françaises",
            GI: "GIBRALTAR",
            DE: "DEUTSCHLAND",
            GR: "ΕΛΛΆΔΑ",
            GP: "GUADELOUPE",
            GG: "GUERNSEY",
            HU: "MAGYARORSZÁG",
            IS: "ÍSLAND",
            IE: "ÉIRE",
            IT: "ITALIA",
            KE: "KENYA",
            LV: "LATVIJA",
            LS: "LESOTHO",
            LI: "LIECHTENSTEIN",
            LT: "LIETUVA",
            LU: "LUXEMBOURG",
            MK: "МАКЕДОНИЈА",
            MT: "MALTA",
            IM: "MAN, ISLE OF",
            MQ: "MARTINIQUE",
            MR: "MAURITANIE",
            MU: "MAURITIUS",
            YT: "MAYOTTE",
            MC: "MONACO",
            ME: "Црна Гора",
            MS: "MONTSERRAT",
            NL: "NEDERLAND",
            AN: "NETHERLANDS ANTILLES",
            NO: "NORGE",
            OM: "سلطنة عمان",
            PL: "POLSKA",
            PT: "PORTUGAL",
            RE: "Réunion",
            RO: "ROMÂNIA",
            SM: "SAN MARINO",
            SN: "Sénégal",
            RS: "Србија",
            SK: "SLOVENSKÁ REPUBLIKA",
            SI: "SLOVENIJA",
            ZA: "SOUTH AFRICA",
            ES: "ESPAÑA",
            SE: "SVERIGE",
            CH: "SCHWEIZ",
            TC: "TURKS AND CAICOS ISLANDS",
            UG: "UGANDA",
            GB: "UNITED KINGDOM",
            VG: "VIRGIN ISLANDS, BRITISH",
            WF: "WALLIS ET FUTUNA",
            ZM: "ZAMBIA",
            AF: "افغانستان",
            JO: "الأردن",
            MA: "المغرب",
            EH: "الصحراء الغربية‎",
            EU: "EUROPEAN UNION",
            DZ: "الجزائر",
            IL: "إسرائيل",
            MX: "MEXICO",
            PM: "SAINT PIERRE ET MIQUELON",
            TN: "تونس",
            TR: "TÜRKİYE",*/
            JP: "日本",
            /*AS: "AMERICAN SAMOA",
            AG: "ANTIGUA AND BARBUDA",
            AZ: "AZƏRBAYCAN",
            BR: "BRASIL",
            KH: "CAMBODIA",
            KY: "CAYMAN ISLANDS",
            CO: "COLOMBIA",
            CR: "COSTA RICA",
            DM: "DOMINICA",
            DO: "REPÚBLICA DOMINICANA",
            EC: "ECUADOR",
            GH: "GHANA",
            GD: "GRENADA",*/
            HK: "香港",
           /* KZ: "КАЗАХСТАН",
            KI: "KIRIBATI",
            FM: "MICRONESIA, FEDERATED STATES OF",
            MZ: "MOÇAMBIQUE",
            NA: "NAMIBIA",
            NZ: "NEW ZEALAND",
            NI: "NICARAGUA",
            NE: "NIGER",
            PW: "PALAU",
            PE: "PERÚ",
            PH: "PHILIPPINES",
            PR: "PUERTO RICO",
            VC: "SAINT VINCENT AND THE GRENADINES",
            TH: "ประเทศไทย",
            TT: "TRINIDAD AND TOBAGO",
            UY: "URUGUAY",
            ZW: "ZIMBABWE",*/
            AU: "AUSTRALIA",
            /*BH: "البحرين",
            BB: "BARBADOS",
            CA: "CANADA",
            CL: "CHILE",
            CX: "CHRISTMAS ISLAND",
            EG: "مصر",
            SV: "EL SALVADOR",
            GT: "GUATEMALA",
            HT: "HAÏTI",
            IN: "INDIA",
            MY: "MALAYSIA",
            NF: "NORFOLK ISLAND",
            PA: "PANAMÁ",
            PG: "PAPUA NEW GUINEA",
            SG: "SINGAPORE",*/
            US: "UNITED STATES",
           /* VN: "VIỆT NAM",
            CU: "CUBA",
            IR: "ایران",
            KR: "한국",
            SY: "SYRIAN ARAB REPUBLIC",
            LB: "لبنان",
            MW: "MALAWI",*/
            MO: "澳門",
           /* QA: "قطر",
            BF: "BURKINA FASO",*/
            CN: "中国",
          /*  HN: "HONDURAS",
            JM: "JAMAICA",
            PK: "PAKISTAN",
            PY: "PARAGUAY",
            KN: "SAINT KITTS AND NEVIS",
            AR: "ARGENTIA",*/
            TW: "台灣",
            NG: "NIGERIA"/*,
            SA: "السعودية"*/
        }
    };

    require(['config/' + config.DEVICE + '/config'], function(otherConf) {
        $.extend(config, otherConf);
    });

    return config;
});