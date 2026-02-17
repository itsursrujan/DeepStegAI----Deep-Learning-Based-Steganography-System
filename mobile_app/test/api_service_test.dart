import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import 'package:deep_steg_ai/api_service.dart';

import 'api_service_test.mocks.dart';

@GenerateMocks([Dio])
void main() {
  late DeepStegService service;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    service = DeepStegService(baseUrl: 'http://localhost:5000', dio: mockDio);
  });

  group('DeepStegService Tests', () {
    test('analyze success returns data', () async {
      final mockResponse = Response(
        data: {
          'detected': true,
          'verdict': 'DETECTED',
          'description': 'Test verdict',
          'ai_analysis': {'available': true, 'score': 0.8, 'threshold': 0.5}
        },
        statusCode: 200,
        requestOptions: RequestOptions(path: '/api/analyze'),
      );

      when(mockDio.post(any, data: anyNamed('data'))).thenAnswer((_) async => mockResponse);

      final image = XFile.fromData(Uint8List(0), name: 'test.png');
      final result = await service.analyze(image);

      expect(result['verdict'], equals('DETECTED'));
      expect(result['ai_analysis']['score'], 0.8);
    });

    test('analyze failure throws exception', () async {
      final mockResponse = Response(
        data: {'error': 'Invalid image format'},
        statusCode: 400,
        requestOptions: RequestOptions(path: '/api/analyze'),
      );

      when(mockDio.post(any, data: anyNamed('data'))).thenAnswer((_) async => mockResponse);

      final image = XFile.fromData(Uint8List(0), name: 'test.png');
      expect(() => service.analyze(image), throwsException);
    });

    test('extract success returns bytes and filename', () async {
      final bytes = Uint8List.fromList([1, 2, 3]);
      final mockResponse = Response(
        data: bytes,
        statusCode: 200,
        headers: Headers.fromMap({'content-disposition': ['attachment; filename="secret.txt"']}),
        requestOptions: RequestOptions(path: '/api/extract', responseType: ResponseType.bytes),
      );

      when(mockDio.post(any, data: anyNamed('data'), options: anyNamed('options')))
          .thenAnswer((_) async => mockResponse);

      final stego = XFile.fromData(Uint8List(0), name: 'stego.png');
      final result = await service.extract(stego: stego);

      expect(result['success'], isTrue);
      expect(result['bytes'], equals(bytes));
      expect(result['filename'], equals('secret.txt'));
    });
  });
}
