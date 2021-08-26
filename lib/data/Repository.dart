
abstract class Repository {
  void saveString(String key, String value);

  void saveObject(String key, Map<String, dynamic> object);

  Future<String?> getString(String key);

  Future<Map<String, dynamic>?> getObject(String key);

  Future<void> removeString(String key);

  Future<void> removeObject(String key);
}