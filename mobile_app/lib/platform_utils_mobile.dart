import 'dart:io';
import 'dart:typed_data';
import 'package:path_provider/path_provider.dart';

class PlatformUtilsImpl {
  static void downloadFile(Uint8List bytes, String fileName) {
    _saveToDisk(bytes, fileName);
  }

  static Future<void> _saveToDisk(Uint8List bytes, String fileName) async {
    Directory? directory;
    try {
      if (Platform.isAndroid) {
        directory = await getExternalStorageDirectory();
      } else {
        directory = await getApplicationDocumentsDirectory();
      }

      if (directory != null) {
        final String filePath = '${directory.path}/$fileName';
        final File file = File(filePath);
        await file.writeAsBytes(bytes);
        debugPrint('File saved to: $filePath');
      }
    } catch (e) {
      debugPrint('Error saving file: $e');
    }
  }
}
