import 'package:flutter/material.dart';

class AppTheme {
  static const Color bgColor = Color(0xFF03080E);
  static const Color surfaceColor = Color(0xFF0A192F);
  static const Color primary = Color(0xFF00F3FF);
  static const Color secondary = Color(0xFF7000FF);
  static const Color accent = Color(0xFFFF00D6);
  static const Color success = Color(0xFF00FF9D);
  static const Color danger = Color(0xFFFF3366);
  static const Color textMain = Colors.white;
  static const Color textMuted = Color(0xFF8892B0);

  static ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: bgColor,
    primaryColor: primary,
    colorScheme: const ColorScheme.dark(
      primary: primary,
      secondary: secondary,
      surface: surfaceColor,
      error: danger,
      onSurface: textMain,
      onPrimary: bgColor,
    ),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
      headlineMedium: TextStyle(color: primary, fontWeight: FontWeight.bold, letterSpacing: 1.5, fontSize: 28),
      titleLarge: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
      bodyLarge: TextStyle(color: textMain, fontSize: 16),
      bodyMedium: TextStyle(color: textMain, fontSize: 14),
      bodySmall: TextStyle(color: textMuted, fontSize: 13),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: true,
      iconTheme: IconThemeData(color: primary),
      titleTextStyle: TextStyle(color: primary, fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 2),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary,
        foregroundColor: bgColor,
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        elevation: 10,
        shadowColor: primary.withOpacity(0.4),
        textStyle: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.2, fontSize: 16),
      ),
    ),
    dialogTheme: DialogTheme(
      backgroundColor: surfaceColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      titleTextStyle: const TextStyle(color: primary, fontSize: 22, fontWeight: FontWeight.bold),
      contentTextStyle: const TextStyle(color: textMain, fontSize: 16),
    ),
    textSelectionTheme: const TextSelectionThemeData(
      cursorColor: primary,
      selectionColor: primary,
      selectionHandleColor: primary,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white.withOpacity(0.05),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: const BorderSide(color: primary, width: 2)),
      labelStyle: const TextStyle(color: textMuted),
      hintStyle: const TextStyle(color: Colors.white54),
      prefixIconColor: primary,
      floatingLabelStyle: const TextStyle(color: primary),
    ),
  );

  static BoxDecoration glassDecoration({double blur = 10, Color? color}) {
    return BoxDecoration(
      color: (color ?? Colors.white).withOpacity(0.05),
      borderRadius: BorderRadius.circular(24),
      border: Border.all(color: Colors.white.withOpacity(0.1)),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.2),
          blurRadius: 20,
          offset: const Offset(0, 10),
        ),
      ],
    );
  }

  static Gradient primaryGradient = const LinearGradient(
    colors: [primary, secondary],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
