import 'package:flutter/material.dart';
import 'theme.dart';
import 'home_screen.dart';
import 'hide_screen.dart';
import 'extract_screen.dart';
import 'analyze_screen.dart';
import 'batch_analyze_screen.dart';
import 'batch_hide_screen.dart'; // Add this
import 'docs_screen.dart';

void main() {
  runApp(const DeepStegApp());
}

class DeepStegApp extends StatelessWidget {
  const DeepStegApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DeepStegAI Pro',
      theme: AppTheme.darkTheme,
      home: const MainDashboard(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class MainDashboard extends StatefulWidget {
  const MainDashboard({super.key});

  @override
  State<MainDashboard> createState() => _MainDashboardState();
}

class _MainDashboardState extends State<MainDashboard> {
  int _currentIndex = 0;

  void _navigateTo(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      appBar: AppBar(
        title: ShaderMask(
          shaderCallback: (bounds) => AppTheme.primaryGradient.createShader(bounds),
          child: const Text('DEEPSTEG AI', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 4)),
        ),
        leading: _currentIndex == 0 
          ? Builder(builder: (context) => IconButton(icon: const Icon(Icons.menu_open, color: AppTheme.primary), onPressed: () => Scaffold.of(context).openDrawer()))
          : IconButton(icon: const Icon(Icons.arrow_back, color: AppTheme.primary), onPressed: () => setState(() => _currentIndex = 0)),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 15),
            decoration: BoxDecoration(shape: BoxShape.circle, color: AppTheme.primary.withOpacity(0.1)),
            child: IconButton(icon: const Icon(Icons.notifications_none, color: AppTheme.primary, size: 20), onPressed: () {}),
          ),
        ],
      ),
      drawer: _buildDrawer(),
      body: Stack(
        children: [
          _buildBackground(),
          SafeArea(
            child: IndexedStack(
              index: _currentIndex,
              children: [
                HomeScreen(onNavigate: _navigateTo),
                const HideScreen(),
                const ExtractScreen(),
                const DetectionScreen(),
                const BatchDetectionScreen(),
                const BatchHideScreen(), // New Screen
                const DocsScreen(),
                const Center(child: Text("Admin Console: Access Restricted", style: TextStyle(color: AppTheme.danger, fontWeight: FontWeight.bold))), 
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBackground() {
    return Positioned.fill(
      child: Container(
        color: AppTheme.bgColor,
        child: Opacity(
          opacity: 0.3,
          child: CustomPaint(painter: GridPainter()),
        ),
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: AppTheme.bgColor,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(gradient: AppTheme.primaryGradient),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text("DeepStegAI", style: TextStyle(color: AppTheme.bgColor, fontSize: 24, fontWeight: FontWeight.bold)),
                Text("Enterprise Security Suite", style: TextStyle(color: AppTheme.bgColor, fontSize: 12)),
              ],
            ),
          ),
          _drawerItem(0, Icons.dashboard_outlined, "Home Dashboard"),
          _drawerItem(1, Icons.visibility_off, "Hide Data"),
          _drawerItem(2, Icons.unarchive, "Extract Data"),
          _drawerItem(3, Icons.analytics, "Detection"),
          _drawerItem(4, Icons.layers_outlined, "Batch Detection"),
          _drawerItem(5, Icons.layers, "Batch Hiding"),
          const Divider(color: Colors.white10),
          _drawerItem(6, Icons.help_outline, "Documentation"),
          _drawerItem(7, Icons.settings, "System Config"),
        ],
      ),
    );
  }

  Widget _drawerItem(int index, IconData icon, String title) {
    return ListTile(
      leading: Icon(icon, color: _currentIndex == index ? AppTheme.primary : AppTheme.textMuted),
      title: Text(title, style: TextStyle(color: _currentIndex == index ? AppTheme.primary : AppTheme.textMain)),
      selected: _currentIndex == index,
      onTap: () {
        setState(() => _currentIndex = index);
        Navigator.pop(context);
      },
    );
  }

  Widget _buildBottomNav() {
    return Container(
      height: 70,
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 30),
      decoration: AppTheme.glassDecoration(blur: 20),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BottomNavigationBar(
          currentIndex: _currentIndex >= 4 ? 0 : _currentIndex,
          onTap: (idx) => setState(() => _currentIndex = idx),
          elevation: 0,
          backgroundColor: Colors.transparent,
          selectedItemColor: AppTheme.primary,
          unselectedItemColor: AppTheme.textMuted,
          type: BottomNavigationBarType.fixed,
          showSelectedLabels: false,
          showUnselectedLabels: false,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_filled, size: 24), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.security, size: 24), label: 'Hide'),
            BottomNavigationBarItem(icon: Icon(Icons.vpn_key_outlined, size: 24), label: 'Extract'),
            BottomNavigationBarItem(icon: Icon(Icons.radar_outlined, size: 24), label: 'Detect'),
          ],
        ),
      ),
    );
  }
}

class GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = AppTheme.primary.withOpacity(0.05)..strokeWidth = 1;
    for (double i = 0; i < size.width; i += 40) { canvas.drawLine(Offset(i, 0), Offset(i, size.height), paint); }
    for (double i = 0; i < size.height; i += 40) { canvas.drawLine(Offset(0, i), Offset(size.width, i), paint); }
  }
  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
