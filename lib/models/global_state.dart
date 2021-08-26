import 'package:flutter/material.dart';
import 'package:wifi_4g/data/FilePersistence.dart';
import 'package:wifi_4g/models/settings.dart';

import 'modem_state.dart';

class GlobalState  with ChangeNotifier {
  Settings settings = Settings();

  ModemState? _modemState;

  String errors = '';

  ModemState? get modemState{
    return _modemState;
  }

  set modemState(ModemState? newModemState){
    _modemState = newModemState;
    notifyListeners();
  }

  void setErrors(String err) {
    errors = err;
    notifyListeners();
  }

  GlobalState() {
    loadSettings();
  }

  FilePersistence _repo = FilePersistence();

  Future loadSettings() async {
    Map<String, dynamic>? map = await _repo.getObject('data');
    if (map != null) {
      settings.ip = map["ip"];
      settings.username = map["username"];
      settings.password = map["password"];
    }
    settings.isLoaded = true;
    notifyListeners();
  }

  Future saveSettings() async {
    Map<String, String> map = {
      'ip': settings.ip,
      'username': settings.username,
      'password': settings.password
    };

    await _repo.saveObject('data', map);
    notifyListeners();
  }


}
