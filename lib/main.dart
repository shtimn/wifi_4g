import 'package:flutter/material.dart';
import 'package:wifi_4g/pages/home.dart';
import 'package:provider/provider.dart';

import 'models/global_state.dart';

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<GlobalState>(
      create: (BuildContext context) => GlobalState(),
      child: MaterialApp(home: HomePage()),
    );
  }
}
