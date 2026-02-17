import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:deep_steg_ai/home_screen.dart';
import 'package:deep_steg_ai/theme.dart';

void main() {
  testWidgets('HomeScreen displays all module tiles and supports navigation', (WidgetTester tester) async {
    // Set a large viewport to avoid visibility issues in tests
    tester.view.physicalSize = const Size(1000, 2000);
    tester.view.devicePixelRatio = 1.0;

    int navigatedIndex = -1;

    await tester.pumpWidget(MaterialApp(
      theme: AppTheme.darkTheme,
      home: Scaffold(
        body: HomeScreen(onNavigate: (index) => navigatedIndex = index),
      ),
    ));

    // Verify presence
    expect(find.text('Hide Secrets'), findsOneWidget);
    expect(find.text('Data Recovery'), findsOneWidget);

    // Ensure visible and tap
    final hideTile = find.text('Hide Secrets');
    await tester.ensureVisible(hideTile);
    await tester.tap(hideTile);
    await tester.pumpAndSettle();

    expect(navigatedIndex, 1);

    // Test another tile
    final recoveryTile = find.text('Data Recovery');
    await tester.ensureVisible(recoveryTile);
    await tester.tap(recoveryTile);
    await tester.pumpAndSettle();

    expect(navigatedIndex, 2);

    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
  });
}
