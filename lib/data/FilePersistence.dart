import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';

import 'Repository.dart';

class FilePersistence implements Repository {
  // 2
  Future<String> get _localPath async {
    final directory = await getApplicationDocumentsDirectory();
    return directory.path;
  }

  // 3
  Future<File> _localFile(String filename) async {
    final path = await _localPath;
    return File('$path/$filename');
  }

  Future<String> getFilename(String type, String key) async {
    return type + '/' + key;
  }

  @override
  Future<Map<String, dynamic>?> getObject(String key) async {
    final filename = await getFilename('objects', key);
    final file = await _localFile(filename);

    if (await file.exists()) {
      final objectString = await file.readAsString();
      return JsonDecoder().convert(objectString);
    }
    return null;
  }

  @override
  Future<String?> getString(String key) async {
    final filename = await getFilename('strings', key);
    final file = await _localFile(filename);

    if (await file.exists()) return await file.readAsString();
    return null;
  }

  @override
  Future<void> removeObject(String key) async {
    final filename = await getFilename('objects', key);
    final file = await _localFile(filename);
    if (await file.exists()) await file.delete();
  }

  @override
  Future<void> removeString(String key) async {
    final filename = await getFilename('strings', key);
    final file = await _localFile(filename);
    if (await file.exists()) await file.delete();
  }

  @override
  Future saveObject(String key, Map<String, dynamic> object) async {
    final filename = await getFilename('objects', key);
    final file = await _localFile(filename);

    if (!await file.parent.exists()) await file.parent.create(recursive: true);

    final jsonString = JsonEncoder().convert(object);
    await file.writeAsString(jsonString);
  }

  @override
  Future saveString(String key, String value) async {
    final filename = await getFilename('strings', key);
    final file = await _localFile(filename);

    if (!await file.parent.exists()) await file.parent.create(recursive: true);

    await file.writeAsString(value);
  }
}
