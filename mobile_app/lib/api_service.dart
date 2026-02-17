import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';

import 'package:flutter/foundation.dart'; // Add this

class DeepStegService {
  // Stable API address for local execution
  static const String serverUrl = "http://127.0.0.1:5000"; 

  final String baseUrl;
  final Dio _dio;

  DeepStegService({String? baseUrl, Dio? dio}) 
      : baseUrl = baseUrl ?? serverUrl,
        _dio = dio ?? Dio();

  Future<Map<String, dynamic>> embed({
    required XFile cover,
    required XFile secret,
    String password = '',
    String method = 'LSB',
  }) async {
    try {
      FormData formData = FormData.fromMap({
        'password': password,
        'method': method,
        'cover': MultipartFile.fromBytes(
          await cover.readAsBytes(),
          filename: cover.name,
        ),
        'secret': MultipartFile.fromBytes(
          await secret.readAsBytes(),
          filename: secret.name,
        ),
      });

      Response response = await _dio.post('$baseUrl/api/embed', data: formData);

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception(response.data['error'] ?? 'Embedding failed');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message);
    }
  }

  Future<Map<String, dynamic>> analyze(XFile image) async {
    try {
      FormData formData = FormData.fromMap({
        'image': MultipartFile.fromBytes(
          await image.readAsBytes(),
          filename: image.name,
        ),
      });

      Response response = await _dio.post('$baseUrl/api/analyze', data: formData);

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception(response.data['error'] ?? 'Analysis failed');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message);
    }
  }

  Future<Map<String, dynamic>> extract({
    required XFile stego,
    String password = '',
    String recoveryToken = '',
  }) async {
    try {
      FormData formData = FormData.fromMap({
        'password': password,
        'recovery_token': recoveryToken,
        'stego': MultipartFile.fromBytes(
          await stego.readAsBytes(),
          filename: stego.name,
        ),
      });

      // We expect a file download (bytes)
      Response response = await _dio.post(
        '$baseUrl/api/extract', 
        data: formData,
        options: Options(responseType: ResponseType.bytes),
      );

      if (response.statusCode == 200) {
        // Extract filename from headers if possible, or use default
        // Extract filename from headers using robust regex
        String filename = 'extracted_file.bin';
        final headers = response.headers;
        final contentDisposition = headers.value('content-disposition') ?? headers.value('Content-Disposition');
        
        if (contentDisposition != null) {
          final regex = RegExp(r'filename="?([^";\n]+)"?');
          final match = regex.firstMatch(contentDisposition);
          if (match != null && match.groupCount >= 1) {
            filename = match.group(1)!;
          }
        }

        return {
          'success': true,
          'bytes': response.data as Uint8List,
          'filename': filename,
        };
      } else {
        // If error, decode the bytes to JSON
        final String errorStr = utf8.decode(response.data as List<int>);
        final errorMap = jsonDecode(errorStr);
        throw Exception(errorMap['error'] ?? 'Extraction failed');
      }
    } on DioException catch (e) {
      if (e.response?.data != null && e.response?.data is List<int>) {
        final String errorStr = utf8.decode(e.response?.data as List<int>);
        final errorMap = jsonDecode(errorStr);
        throw Exception(errorMap['error'] ?? 'Network error during extraction');
      }
      throw Exception(e.message);
    }
  }

  Future<Map<String, dynamic>> batchDetection(List<XFile> images) async {
    try {
      List<MultipartFile> imageFiles = [];
      for (var img in images) {
        imageFiles.add(MultipartFile.fromBytes(
          await img.readAsBytes(),
          filename: img.name,
        ));
      }

      FormData formData = FormData.fromMap({
        'images': imageFiles,
      });

      Response response = await _dio.post('$baseUrl/api/detection/batch', data: formData);

      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw Exception(response.data['error'] ?? 'Batch detection failed');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message);
    }
  }

  Future<Map<String, dynamic>> batchEmbed({
    required List<XFile> covers,
    required XFile secret,
    String password = '',
  }) async {
    try {
      List<MultipartFile> coverFiles = [];
      for (var cover in covers) {
        coverFiles.add(MultipartFile.fromBytes(
          await cover.readAsBytes(),
          filename: cover.name,
        ));
      }

      FormData formData = FormData.fromMap({
        'mode': 'hide',
        'password': password,
        'covers': coverFiles,
        'secret': MultipartFile.fromBytes(
          await secret.readAsBytes(),
          filename: secret.name,
        ),
      });

      Response response = await _dio.post(
        '$baseUrl/api/batch', 
        data: formData,
        options: Options(responseType: ResponseType.bytes),
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'bytes': response.data as Uint8List,
          'filename': 'batch_stego.zip',
        };
      } else {
        // If error, decode the bytes to JSON (if it returned JSON)
        try {
          final String errorStr = utf8.decode(response.data as List<int>);
          final errorMap = jsonDecode(errorStr);
          throw Exception(errorMap['error'] ?? 'Batch embedding failed');
        } catch (_) {
          throw Exception('Batch embedding failed');
        }
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message);
    }
  }

  Future<Map<String, dynamic>> batchExtract({
    required List<XFile> stegos,
    String password = '',
  }) async {
    try {
      List<MultipartFile> stegoFiles = [];
      for (var stego in stegos) {
        stegoFiles.add(MultipartFile.fromBytes(
          await stego.readAsBytes(),
          filename: stego.name,
        ));
      }

      FormData formData = FormData.fromMap({
        'mode': 'extract',
        'password': password,
        'stegos': stegoFiles,
      });

      Response response = await _dio.post(
        '$baseUrl/api/batch', 
        data: formData,
        options: Options(responseType: ResponseType.bytes),
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'bytes': response.data as Uint8List,
          'filename': 'batch_extracted.zip',
        };
      } else {
        try {
          final String errorStr = utf8.decode(response.data as List<int>);
          final errorMap = jsonDecode(errorStr);
          throw Exception(errorMap['error'] ?? 'Batch extraction failed');
        } catch (_) {
          throw Exception('Batch extraction failed');
        }
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message);
    }
  }
}
