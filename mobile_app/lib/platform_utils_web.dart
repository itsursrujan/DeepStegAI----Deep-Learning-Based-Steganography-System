// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;
import 'dart:typed_data';

class PlatformUtilsImpl {
  static void downloadFile(Uint8List bytes, String fileName) {
    // Determine MIME type based on extension
    String mimeType = 'application/octet-stream';
    if (fileName.toLowerCase().endsWith('.png')) mimeType = 'image/png';
    if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
    if (fileName.toLowerCase().endsWith('.zip')) mimeType = 'application/zip';

    final blob = html.Blob([bytes], mimeType);
    final url = html.Url.createObjectUrlFromBlob(blob);
    
    // IMPORTANT: No 'await' or 'async' before anchor.click() to keep User Gesture context
    final anchor = html.AnchorElement(href: url)
      ..setAttribute("download", fileName)
      ..style.display = 'none';
    
    html.document.body?.append(anchor);
    anchor.click();
    
    // Cleanup with a much longer delay to ensure browser has started the stream
    Future.delayed(const Duration(seconds: 15), () {
      anchor.remove();
      html.Url.revokeObjectUrl(url);
    });
  }
}
