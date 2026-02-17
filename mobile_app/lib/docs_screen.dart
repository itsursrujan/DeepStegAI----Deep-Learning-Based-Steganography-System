import 'package:flutter/material.dart';
import 'theme.dart';

class DocsScreen extends StatelessWidget {
  const DocsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 30),
          _buildDocSection(
            "ALGORITHM OVERVIEW",
            [
              _docItem(
                "LSB Standard",
                "The classic Least Significant Bit method. It is high-capacity and fast but can be detected by statistical analysis. Ideal for non-adversarial environments.",
              ),
              _docItem(
                "Adaptive Edge-Based",
                "Our flagship stealth mode. It only hides data in the high-frequency 'edges' of an image where human and machine eyes struggle to find patterns. Very hard to detect.",
              ),
            ],
          ),
          const SizedBox(height: 30),
          _buildDocSection(
            "SECURITY PROTOCOLS",
            [
              _docItem(
                "Vault Keys (Passwords)",
                "Standard AES-256 encryption. Your password is never stored on the server; it is used locally to derive the encryption key.",
              ),
              _docItem(
                "Recovery Tokens",
                "A 44-character base64 encoded string. It is the raw derived key. If you lose your password, this token can bypass the decryption process.",
              ),
            ],
          ),
          const SizedBox(height: 30),
          _buildDocSection(
            "AI ANALYSIS SYSTEM",
            [
              _docItem(
                "Probability Score",
                "A value from 0% to 100%. Scores above 50% indicate potential steganographic artifacts. High resolution images yield more accurate results.",
              ),
              _docItem(
                "Spectral Anomalies",
                "The AI looks for discontinuities in pixel distribution that are mathematically impossible in natural photography.",
              ),
            ],
          ),
          const SizedBox(height: 50),
          _buildSupportFooter(),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Knowledge Base", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white)),
        Container(height: 4, width: 60, margin: const EdgeInsets.symmetric(vertical: 8), decoration: BoxDecoration(gradient: AppTheme.primaryGradient, borderRadius: BorderRadius.circular(2))),
        const Text("Protocols and technical specifications for DeepSteg operations.", style: TextStyle(color: AppTheme.textMuted)),
      ],
    );
  }

  Widget _buildDocSection(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 2, color: AppTheme.primary)),
        const SizedBox(height: 15),
        ...items,
      ],
    );
  }

  Widget _docItem(String title, String content) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(20),
      decoration: AppTheme.glassDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
          const SizedBox(height: 8),
          Text(content, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted, height: 1.5)),
        ],
      ),
    );
  }

  Widget _buildSupportFooter() {
    return Center(
      child: Column(
        children: [
          const Icon(Icons.shield_outlined, color: AppTheme.primary, size: 40),
          const SizedBox(height: 20),
          const Text("DeepStegAI Enterprise v1.2.4", style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
          const Text("Developed by Advanced Agentic Coding Team", style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
        ],
      ),
    );
  }
}
