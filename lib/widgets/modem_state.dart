import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:wifi_4g/models/global_state.dart';
import 'package:wifi_4g/widgets/spinner.dart';

class ModeStateWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    GlobalState globalState = context.watch<GlobalState>();
    Widget child;
    if (globalState.modemState == null) {
      child = Center(
          child: SizedBox(
        child: CircularProgressIndicator(),
        width: 60,
        height: 60,
      ));
    } else if (globalState.modemState!.hasConnection) {
      child = Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Провайдер: ${globalState.modemState!.network_provider}',
            style: TextStyle(fontSize: 20.0)),
        SizedBox(height: 10),
        Text('Тип сети: ${globalState.modemState!.network_type}',
            style: TextStyle(fontSize: 20.0)),
        SizedBox(height: 10),
        Row(children: [
          Text('Уровень сигнала: ${globalState.modemState!.signalbar} из 5',
              style: TextStyle(fontSize: 20.0)),
        ]),
        SizedBox(height: 10),
        Row(children: [
          Text('Подключение к интернет: ', style: TextStyle(fontSize: 20.0)),
          globalState.modemState!.ppp_status == 'ppp_connected'
              ? Icon(Icons.cloud_done_outlined, color: Colors.green)
              : Icon(Icons.cloud_off_outlined, color: Colors.red),
        ]),
        SizedBox(height: 10),
        Row(children: [
          Text('Ручной выбор сети: ${globalState.modemState!.net_select}',
              style: TextStyle(fontSize: 20.0)),
        ]),
      ]);
    } else {
      child = Column(children: [
        Text(
          'Нет соединения',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 20),
        ),
        SizedBox(height: 20),
        Text(globalState.errors)
      ]);
    }
    return child;
  }
}
