class ModemState {
  final String network_type;
  final String network_provider;
  final String signalbar;
  final String net_select;
  final String ppp_status; // ppp_connected | ppp_disconnected
  final bool hasConnection;

  ModemState.fromJson(Map<String, dynamic> json)
      : network_type = json['network_type'],
        network_provider = json['network_provider'],
        signalbar = json['signalbar'],
        ppp_status = json['ppp_status'],
        net_select = json['net_select'] ?? '',
        hasConnection = true;

  ModemState.noConnection()
      : network_type = '',
        network_provider = '',
        signalbar = '',
        ppp_status = '',
        net_select = '',
        hasConnection = false;

  ModemState._noConnection()
      : network_type = 'LTE',
        network_provider = 'BEELINE',
        signalbar = '3',
        ppp_status = 'ppp_discnnected',
        net_select = '',
        hasConnection = true;
}
