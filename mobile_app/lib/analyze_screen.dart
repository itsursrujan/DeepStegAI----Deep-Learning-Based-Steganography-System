import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'theme.dart';
import 'api_service.dart';

class DetectionScreen extends StatefulWidget {
  const DetectionScreen({super.key});

  @override
  State<DetectionScreen> createState() => _DetectionScreenState();
}

class _DetectionScreenState extends State<DetectionScreen> {
  XFile? _selectedImage;
  Map<String, dynamic>? _analysisResult;
  bool _isAnalyzing = false;

  final _service = DeepStegService();

  Future<void> _handleAnalyze() async {
    if (_selectedImage == null) return;

    setState(() {
      _isAnalyzing = true;
      _analysisResult = null;
    });

    try {
      final result = await _service.analyze(_selectedImage!);
      setState(() => _analysisResult = result);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(backgroundColor: AppTheme.danger, content: Text("Scan Failed: $e")));
      }
    } finally {
      setState(() => _isAnalyzing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 30),
          _buildImagePicker(),
          const SizedBox(height: 30),
          if (_isAnalyzing)
            _buildScanningLoader()
          else if (_analysisResult != null)
            _buildResultCard()
          else
            _buildScanButton(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Steganalysis", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white)),
        Container(height: 4, width: 60, margin: const EdgeInsets.symmetric(vertical: 8), decoration: BoxDecoration(gradient: AppTheme.primaryGradient, borderRadius: BorderRadius.circular(2))),
        const Text("Scanning for neural-network artifacts and pixel anomalies.", style: TextStyle(color: AppTheme.textMuted)),
      ],
    );
  }

  Widget _buildImagePicker() {
    return InkWell(
      onTap: () async {
        final ImagePicker picker = ImagePicker();
        final XFile? image = await picker.pickImage(source: ImageSource.gallery);
        if (image != null) setState(() => _selectedImage = image);
      },
      child: Container(
        width: double.infinity,
        height: 250,
        decoration: AppTheme.glassDecoration(),
        child: _selectedImage == null
            ? const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.radar, size: 50, color: AppTheme.primary),
                  SizedBox(height: 15),
                  Text("Select Image for Analysis", style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
                ],
              )
            : ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: FutureBuilder(
                  future: _selectedImage!.readAsBytes(),
                  builder: (context, snapshot) {
                    if (snapshot.hasData) return Image.memory(snapshot.data!, fit: BoxFit.contain);
                    return const CircularProgressIndicator();
                  },
                ),
              ),
      ),
    );
  }

  Widget _buildScanningLoader() {
    return Column(
      children: [
        const LinearProgressIndicator(backgroundColor: Colors.white10),
        const SizedBox(height: 20),
        const Text("DECRYPTING PIXEL SIGNATURES...", style: TextStyle(color: AppTheme.primary, letterSpacing: 2, fontSize: 12, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildScanButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: _selectedImage == null ? null : _handleAnalyze,
        icon: const Icon(Icons.radar),
        label: const Text("Run Analysis"),
      ),
    );
  }

  Widget _buildResultCard() {
    final aiScore = _analysisResult!['ai_analysis']['score'] as double;
    final verdict = _analysisResult!['verdict'] as String;
    final description = _analysisResult!['description'] as String;

    Color verdictColor = AppTheme.success;
    if (verdict == 'SUSPICIOUS') verdictColor = Colors.orange;
    if (verdict == 'DETECTED') verdictColor = AppTheme.danger;

    return Container(
      padding: const EdgeInsets.all(30),
      decoration: AppTheme.glassDecoration(color: verdictColor),
      child: Column(
        children: [
          Text(verdict, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: verdictColor, letterSpacing: 4)),
          const SizedBox(height: 15),
          Text(description, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.textMuted)),
          const Divider(height: 40, color: Colors.white10),
          const Text("PROBABILITY SCORE", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2, color: AppTheme.textMuted)),
          const SizedBox(height: 20),
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                height: 140, width: 140,
                child: CircularProgressIndicator(value: aiScore, strokeWidth: 12, backgroundColor: Colors.white10, valueColor: AlwaysStoppedAnimation<Color>(verdictColor)),
              ),
              Text("${(aiScore * 100).toStringAsFixed(1)}%", style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900)),
            ],
          ),
          const SizedBox(height: 20),
          TextButton(onPressed: () => setState(() => _analysisResult = null), child: const Text("RESET SCANNER", style: TextStyle(color: AppTheme.primary))),
        ],
      ),
    );
  }
}
