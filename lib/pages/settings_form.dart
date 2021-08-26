import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// ignore: import_of_legacy_library_into_null_safe
import 'package:validators/validators.dart';
import 'package:wifi_4g/models/global_state.dart';

import '../models/settings.dart';

class SettingsForm extends StatelessWidget {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    GlobalState globalState = context.watch<GlobalState>();
    Settings settings = globalState.settings;

    return Scaffold(
        appBar: AppBar(
          title: Text('Text'),
        ),
        body: Container(
            padding: EdgeInsets.all(10),
            width: double.infinity,
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  TextFormField(
                    decoration: const InputDecoration(
                      icon: Icon(Icons.wifi),
                      labelText: 'Адрес IP',
                    ),
                    initialValue: settings.ip,
                    onSaved: (val) => settings.ip = val!,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Введите значение';
                      }
                      if (!isIP(value, 4)) {
                        return 'Введите верное значение';
                      }
                      return null;
                    },
                  ),
                  SizedBox(
                    height: 20,
                  ),
                  TextFormField(
                    decoration: const InputDecoration(
                      icon: Icon(Icons.person),
                      labelText: 'Имя пользователя',
                    ),
                    initialValue: settings.username,
                    onSaved: (val) => settings.username = val!,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Введите значение';
                      }
                      return null;
                    },
                  ),
                  SizedBox(
                    height: 20,
                  ),
                  TextFormField(
                    decoration: const InputDecoration(
                      icon: Icon(Icons.security),
                      labelText: 'Пароль',
                    ),
                    initialValue: settings.password,
                    onSaved: (val) => settings.password = val!,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Введите значение';
                      }
                      return null;
                    },
                  ),
                  SizedBox(
                    height: 20,
                  ),
                  ElevatedButton(
                    onPressed: () {
                      if (_formKey.currentState!.validate()) {
                        _formKey.currentState!.save();
                        globalState.saveSettings();

                        ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Данные сохранены')));

                        Navigator.pop(context);
                      }
                    },
                    child: Text('Сохранить'),
                  ),
                ],
              ),
            )));
  }
}
