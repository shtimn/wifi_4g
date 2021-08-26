import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:wifi_4g/models/global_state.dart';
import 'package:wifi_4g/models/settings.dart';
import 'package:wifi_4g/services/kuwfi.dart';
import 'package:wifi_4g/widgets/modem_state.dart';
import 'package:wifi_4g/widgets/spinner.dart';

import 'settings_form.dart';

class HomePage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    GlobalState globalState = context.watch<GlobalState>();
    Settings settings = globalState.settings;

    Timer(Duration(seconds: 5), () async {
      var modem = KuWfiService(globalState);
      globalState.modemState = await modem.getState();
      // if (globalState.modemState!.hasConnection &&
      //     globalState.modemState!.net_select != 'Only_LTE') {
      //   await modem.setOnlyLTE();
      // }
    });

    showAlertDialog(BuildContext context) {
      // set up the button
      Widget okButton = TextButton(
        child: Text("Перезагрузить"),
        onPressed: () async {

          var modem = KuWfiService(globalState);
          await modem.reboot();
          Navigator.of(context).pop();
        },
      );

      // set up the AlertDialog
      AlertDialog alert = AlertDialog(
        content: Text("Перезагрузить модем ?"),
        actions: [
          okButton,
        ],
      );

      // show the dialog
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return alert;
        },
      );
    }

    return Scaffold(
        appBar: AppBar(
          title: const Text('WIFI 4G'),
          actions: <Widget>[
            IconButton(
              icon: const Icon(Icons.settings),
              tooltip: 'Настройки',
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => SettingsForm(),
                  ),
                );
              },
            ),
          ],
        ),
        body: SingleChildScrollView(
            child: Container(
          padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
          width: double.infinity,
          child: Center(
              child: !settings.isLoaded
                  ? Spinner()
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                          ModeStateWidget(),
                          SizedBox(height: 40),
                          ...(globalState.modemState != null &&
                                  globalState.modemState!.hasConnection)
                              ? [
                                  ElevatedButton(
                                    child: Text('Перевести в 4G'),
                                    style: ElevatedButton.styleFrom(
                                        minimumSize: Size(40, 40)
                                        // put the width and height you want
                                        ,
                                        primary: globalState
                                                    .modemState!.net_select ==
                                                'Only_LTE'
                                            ? Colors.grey[500]
                                            : Colors.green[600]),
                                    onPressed: () async {
                                      if (globalState
                                          .modemState!.hasConnection) {
                                        var modem = KuWfiService(globalState);
                                        await modem.setOnlyLTE();
                                      }
                                    },
                                  ),
                                  SizedBox(height: 20),
                                  ElevatedButton(
                                    child: Text('Перевести в 3G'),
                                    style: ElevatedButton.styleFrom(
                                        minimumSize: Size(40, 40)
                                        // put the width and height you want
                                        ,
                                        primary: Colors.grey[500]),
                                    onPressed: () async {
                                      if (globalState
                                          .modemState!.hasConnection) {
                                        var modem = KuWfiService(globalState);
                                        await modem.setOnlyWCDMA();
                                      }
                                    },
                                  ),
                                  SizedBox(height: 20),
                                  ElevatedButton(
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.power_settings_new),
                                        Text('Перезагрузить')
                                      ],
                                    ),
                                    style: ElevatedButton.styleFrom(
                                        minimumSize: Size(40, 40),
                                        primary: Colors.deepOrange[900]),
                                    onPressed: () async {
                                      showAlertDialog(context);
                                    },
                                  ),
                                  SizedBox(height: 20),
                                  ElevatedButton(
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.close),
                                        Text('Закрыть')
                                      ],
                                    ),
                                    style: ElevatedButton.styleFrom(
                                        minimumSize: Size(40, 40),
                                        primary: Colors.red[900]),
                                    onPressed: () => exit(0),
                                  ),
                                ]
                              : []
                        ])),
        )));
  }
}
