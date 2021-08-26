import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:wifi_4g/models/global_state.dart';
import 'package:wifi_4g/models/settings.dart';
import 'package:wifi_4g/models/modem_state.dart';

class KuWfiService {
  GlobalState globalState;
  late Settings settings;
  late http.Client client;

  KuWfiService(this.globalState) {
    settings = globalState.settings;
    client = http.Client();
  }

  Future<bool> postRequest(
      Map<String, String> body, String successResult) async {
    try {
      var response = await client
          .post(
              Uri.parse('http://${settings.ip}/goform/goform_set_cmd_process'),
              body: body)
          .timeout(Duration(seconds: 2));
      if (response.statusCode == 200) {
        var data = json.decode(response.body);
        if (data['result'] == successResult) {
          return true;
        }
      }
      globalState.setErrors(response.body);
    } catch (e) {
      globalState.setErrors(e.toString());
      return false;
    }

    return false;
  }

  Future<bool> login() async {
    var str = "${settings.username}\n${settings.password}";
    var bytes = utf8.encode(str);
    var base64Str = base64.encode(bytes);

    return postRequest(
        {'isTest': 'false', 'goformId': 'LOGIN', 'password': base64Str}, '0');
  }

  Future<bool> setOnlyLTE() async {
    if (!await login()) {
      return false;
    }
    return postRequest({
      'isTest': 'false',
      'goformId': 'SET_BEARER_PREFERENCE',
      'BearerPreference': 'Only_LTE\nL'
    }, 'success');
  }

  Future<bool> setOnlyWCDMA() async {
    if (!await login()) {
      return false;
    }
    return postRequest({
      'isTest': 'false',
      'goformId': 'SET_BEARER_PREFERENCE',
      'BearerPreference': 'Only_WCDMA\nL'
    }, 'success');
  }

  Future reboot() async {
    if (!await login()) {
      return false;
    }
    return postRequest({
      'isTest': 'false',
      'goformId': 'REBOOT_DEVICE',
    }, 'success');
  }

  Future<ModemState> getState() async {
    if (!await login()) {
      return ModemState.noConnection();
    }
    try {
      var response = await client
          .get(Uri.parse(
              'http://${settings.ip}/goform/goform_get_cmd_process?multi_data=1&isTest=false&sms_received_flag_flag=0&sts_received_flag_flag=0&cmd=modem_main_state%2Cpin_status%2Cloginfo%2Cnew_version_state%2Ccurrent_upgrade_state%2Cis_mandatory%2Csms_received_flag%2Csts_received_flag%2Csignalbar%2Cnetwork_type%2Cnetwork_provider%2Cnet_select%2Cppp_status%2CEX_SSID1%2Csta_ip_status%2CEX_wifi_profile%2Cm_ssid_enable%2Csms_unread_num%2Crj45level%2CRadioOff%2Csimcard_roam%2Clan_ipaddr%2Cstation_mac%2Cbattery_charging%2Cbattery_vol_percent%2Cbattery_pers%2Cspn_display_flag%2Cplmn_display_flag%2Cspn_name_data%2Cspn_b1_flag%2Cspn_b2_flag%2Crealtime_tx_bytes%2Crealtime_rx_bytes%2Crealtime_time%2Crealtime_tx_thrpt%2Crealtime_rx_thrpt%2Cmonthly_rx_bytes%2Cmonthly_tx_bytes%2Cmonthly_time%2Cdate_month%2Cdata_volume_limit_switch%2Cdata_volume_limit_size%2Cusbconnected%2Cdata_volume_alert_percent%2Cdata_volume_limit_unit%2Croam_setting_option%2Cupg_roam_switch&_=1618141813728'))
          .timeout(Duration(seconds: 2));
      if (response.statusCode == 200) {
        var data = json.decode(response.body);
        return ModemState.fromJson(data);
      }
      globalState.setErrors(response.body);
      return ModemState.noConnection();
    } catch (e) {
      globalState.setErrors(e.toString());
      return ModemState.noConnection();
    }
  }
}
