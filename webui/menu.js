define(function() {
    var needLogin = true;
    var menu = [
  
      // rm SD share  
     /*	{
            hash:'#httpshare_guest',
            path:'sd/httpshare',
            level:'',
            requireLogin:false,
            checkSIMStatus:false
        },*/
        
    

        // level 1 menu
        {
            hash:'#login',
            path:'login',
            level:'1',
            requireLogin:false,
            checkSIMStatus:false
        } ,
        {
            hash:'#home',
            path:'home',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:true
        } ,
        {
            hash:'#status',
            path:'status/device_info',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:false
        },


        /*{
            hash:'#sd',
            path:'sd/sd',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:false
        },*///cpf903 rm
        {
            hash:'#driverdownload',
            path:'driverdownload/driverdownload',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
       {
            hash:'#sms',
            path:'sms/smslist',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#phonebook',
            path:'phonebook/phonebook',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
       /*   {
            hash:'#USSD',
            path:'ussd/ussd',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
  
       // begin to delete menu item 
     {
            hash:'#STK',
            path:'stk/stk',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
	{
            hash:'#stk',
            path:'stk/stk',
            level:'2',
            parent:'#STK',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        */ 
// end
	{
            hash:'#setting',
            //path:'adm/quick_setting',
            path:'network/dial_setting',
            level:'1',
            requireLogin:needLogin,
            checkSIMStatus:true
        },


        // level 2 menu
        /*{
            hash:'#quick_setting',
            path:'adm/quick_setting',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:true
        },*/
        {
            hash:'#net_setting',
            path:'network/dial_setting',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
       /* {
            hash:'#ipv6_setting',
            path:'adm/ipv6_setting',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },*///fjj  add  2  level menu  IPV6
        {
            hash:'#rj45',
            path:'rj45/eth_settings',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        
        {
            hash:'#wifi',
            path:'wifi/wifi_basic',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#device_setting',
            path:'adm/password',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        /*{
            hash:'#firewall',
            path:'firewall/port_map',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },*/
        {
            hash:'#router_setting',
            path:'adm/lan',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
         {
            hash:'#update',
            path:'adm/update',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_all',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_common',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_family',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_friend',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#group_colleague',
            path:'phonebook/phonebook',
            level:'2',
            parent:'#phonebook',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#device_info',
            path:'status/device_info',
            level:'2',
            parent:'#status',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
		{
			hash:'#traffic_statistics',
			path:'status/traffic_statistics',
			level:'2',
			parent:'#status',
			requireLogin:needLogin,
            checkSIMStatus:false
		},
		{
			hash:'#traffic_alert',
			path:'status/traffic_alert',
			level:'2',
			parent:'#status',
			requireLogin:needLogin,
            checkSIMStatus:false
		},
        /*{
            hash:'#sdcard',
            path:'sd/sd',
            level:'2',
            parent:'#sd',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#httpshare',
            path:'sd/httpshare',
            level:'2',
            parent:'#sd',
            requireLogin:needLogin,
            checkSIMStatus:false
        },*///cpf903 rm
        {
            hash:'#smslist',
            path:'sms/smslist',
            level:'2',
            parent:'#sms',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#sim_messages',
            path:'sms/sim_messages',
            level:'2',
            parent:'#sms',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        {
            hash:'#sms_setting',
            path:'sms/sms_setting',
            level:'2',
            parent:'#sms',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
         
        {
            hash:'#eth_settings',
            path:'rj45/eth_settings',
            level:'3',
            parent:'#rj45',
            requireLogin:needLogin,
            checkSIMStatus:false

        },
        {
            hash:'#eth_status',
            path:'rj45/eth_status',
            level:'3',
            parent:'#rj45',
            requireLogin:needLogin,
            checkSIMStatus:false

        },
        /*{
            hash:'#ap_station',
            path:'wifi/ap_station',
            level:'2',
            parent:'#setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        }
        // level 3 menu
        ,*/
        {
            hash:'#dial_setting',
            path:'network/dial_setting',
            level:'3',
            parent:'#net_setting',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        {
            hash:'#net_select',
            path:'network/net_select',
            level:'3',
            parent:'#net_setting',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        {
            hash:'#apn_setting',
            path:'network/apn_setting',
            level:'3',
            parent:'#net_setting',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        {
            hash:'#wifi_basic',
            path:'wifi/wifi_basic',
            level:'3',
            parent:'#wifi',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        /*{
            hash:'#wifi_advance',
            path:'wifi/wifi_advance',
            level:'3',
            parent:'#wifi',
            requireLogin:needLogin,
            checkSIMStatus:false
        },*/
        {
            hash:'#wps',
            path:'wifi/wps',
            level:'3',
            parent:'#wifi',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#password_management',
            path:'adm/password',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#pin_management',
            path:'adm/pin',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin,
            checkSIMStatus:true
        },
        {
            hash:'#restore',
            path:'adm/restore',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#restart',
            path:'adm/restart',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        /*{
            hash:'#sleep_mode',
            path:'wifi/sleep_mode',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin,
            checkSIMStatus:false
        },*/
 /*       {
            hash:'#dlna_setting',
            path:'adm/dlna',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin
        },
        {
            hash:'#fastboot',
            path:'adm/fastboot',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin
        },*/
       /* {
            hash:'#port_filter',
            path:'firewall/port_filter',
            level:'3',
            parent:'#firewall',
            requireLogin:needLogin,
            checkSIMStatus:false
        },*/
    /*去掉端口转发，改成端口映射功能，实际上不支持端口转发，支持端口映射
     {
     hash:'#port_forward',
     path:'firewall/port_forward',
     level:'3',
     parent:'#firewall',
     requireLogin:needLogin
     },
     */
       /* {
            hash:'#port_map',
            path:'firewall/port_map',
            level:'3',
            parent:'#firewall',
            requireLogin:needLogin,
            checkSIMStatus:false
        },*/
       /* {
            hash:'#dns_filter',
            path:'firewall/dns_filter',
            level:'3',
            parent:'#firewall',
            requireLogin:needLogin,
            checkSIMStatus:false
        },*/
		    /*
		     {
		     hash:'#system_security',
		     path:'firewall/system_security',
		     level:'3',
		     parent:'#firewall',
		     requireLogin:needLogin
		     },
		     */
		 // add system_log function@2014.03
		/*{
			hash:'#system_log',
			path:'status/system_log',
			level:'2',
			parent:'#status',
			requireLogin:needLogin,
			checkSIMStatus:false
		},*/
        // add date_setting function @2014.2
		/*{
			hash:'#date_management',
			path:'wifi/date_setting',
			level:'3',
			parent:'#device_setting',
			requireLogin:needLogin,
			checkSIMStatus:false
		},*/
     	/*{
			hash:'#log',
			path:'log/log',
			level:'3',
			parent:'#device_setting',
			requireLogin:needLogin,
			checkSIMStatus:false
		},*/
     	{
			hash:'#version_info',
			path:'version_info/version_info',
			level:'3',
			parent:'#device_setting',
			requireLogin:needLogin,
			checkSIMStatus:false
		},
        {
            hash:'#ussd',
            path:'ussd/ussd',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin,
            checkSIMStatus:true
        }
     // delete upnp / dmz / update_management
     // do not support these
     /*
        {
            hash:'#upnp',
            path:'firewall/upnp_setting',
            level:'3',
            parent:'#firewall',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#update_management',
            path:'update/update_info',
            level:'3',
            parent:'#device_setting',
            requireLogin:needLogin
        }
        */,
		/*{
            hash:'#dmz',
            path:'firewall/dmz_setting',
            level:'3',
            parent:'#firewall',
            requireLogin:needLogin,
            checkSIMStatus:false
        },
        {
            hash:'#Nat',
            path:'firewall/nat_setting',
            level:'3',
            parent:'#firewall',
            requireLogin:needLogin,
            checkSIMStatus:false
        }*/

    ];

    return menu;
});
