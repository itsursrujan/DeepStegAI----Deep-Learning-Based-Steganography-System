import 'dart:ui';
import 'package:flutter/material.dart';
import 'theme.dart';

class HomeScreen extends StatelessWidget {
  final Function(int) onNavigate;
  const HomeScreen({super.key, required this.onNavigate});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildGreetings(),
          const SizedBox(height: 30),
          _buildQuickActions(),
          const SizedBox(height: 40),
          _buildFeatureGrid(),
          const SizedBox(height: 100), // Space for bottom nav backdrop
        ],
      ),
    );
  }

  Widget _buildGreetings() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Welcome, Agent", style: TextStyle(fontSize: 14, color: AppTheme.primary, letterSpacing: 2, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text("System Ready", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white)),
        const Text("Select a module to begin encryption operations.", style: TextStyle(color: AppTheme.textMuted)),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AppTheme.glassDecoration(color: AppTheme.primary),
      child: Row(
        children: [
          const Icon(Icons.bolt, color: AppTheme.primary, size: 30),
          const SizedBox(width: 15),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("NEURAL SCAN ACTIVE", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text("AI Engine v4.2 is online and ready for batch analysis.", style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => onNavigate(3), // Navigate to Analyze
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              textStyle: const TextStyle(fontSize: 12),
            ),
            child: const Text("RUN SCAN"),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 20,
      mainAxisSpacing: 20,
      children: [
        _featureCard(
          icon: Icons.security,
          title: "Hide Data",
          desc: "Embed hidden data into images.",
          color: AppTheme.primary,
          onTap: () => onNavigate(1),
        ),
        _featureCard(
          icon: Icons.vpn_key_outlined,
          title: "Extract Data",
          desc: "Extract payloads from stego-files.",
          color: AppTheme.secondary,
          onTap: () => onNavigate(2),
        ),
        _featureCard(
          icon: Icons.radar_outlined,
          title: "Detection",
          desc: "Deep pixel scan for anomalies.",
          color: AppTheme.accent,
          onTap: () => onNavigate(3),
        ),
        _featureCard(
          icon: Icons.layers_outlined,
          title: "Batch Detection",
          desc: "Audit multiple files for stego.",
          color: AppTheme.success,
          onTap: () => onNavigate(4),
        ),
        _featureCard(
          icon: Icons.layers,
          title: "Batch Hiding",
          desc: "Hide data into multiple carriers.",
          color: AppTheme.primary,
          onTap: () => onNavigate(5),
        ),
        _featureCard(
          icon: Icons.menu_book_outlined,
          title: "Manual",
          desc: "Documentation and protocols.",
          color: Colors.white,
          onTap: () => onNavigate(6),
        ),
        _featureCard(
          icon: Icons.settings_input_component_outlined,
          title: "Admin",
          desc: "System logs and configuration.",
          color: AppTheme.textMuted,
          onTap: () => onNavigate(7),
        ),
      ],
    );
  }

  Widget _featureCard({required IconData icon, required String title, required String desc, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: AppTheme.glassDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 32),
            const Spacer(),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 4),
            Text(desc, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted), maxLines: 2, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}
