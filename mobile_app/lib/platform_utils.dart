import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'platform_utils_stub.dart'
    if (dart.library.html) 'platform_utils_web.dart'
    if (dart.library.io) 'platform_utils_mobile.dart';

abstract class PlatformUtils {
  static void downloadFile(Uint8List bytes, String fileName) {
    PlatformUtilsImpl.downloadFile(bytes, fileName);
  }
}
