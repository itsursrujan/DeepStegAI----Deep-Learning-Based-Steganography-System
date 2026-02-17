import 'dart:ui';
import 'dart:convert';
import 'package:flutter/foundation.dart'; // For kIsWeb
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'theme.dart';
import 'api_service.dart';
import 'platform_utils.dart'; // Add this

// Removed direct dart:html import

class HideScreen extends StatefulWidget {
  const HideScreen({super.key});

  @override
  State<HideScreen> createState() => _HideScreenState();
}

class _HideScreenState extends State<HideScreen> {
  XFile? _coverImage;
  XFile? _secretFile;
  final _passwordController = TextEditingController();
  String _selectedMethod = 'LSB';
  bool _isEmbedding = false;

  final _service = DeepStegService();

  Future<void> _handleEmbed() async {
    if (_coverImage == null || _secretFile == null) {
      _showError("Hold on! You need both a host image and a secret file.");
      return;
    }

    setState(() => _isEmbedding = true);

    try {
      final result = await _service.embed(
        cover: _coverImage!,
        secret: _secretFile!,
        password: _passwordController.text,
        method: _selectedMethod,
      );

      if (mounted) {
        // QUICK START: Trigger download immediately
        PlatformUtils.downloadFile(base64Decode(result['image_data']), result['filename']);
        _showSuccessDialog(result);
      }
    } catch (e) {
      if (mounted) {
        _showError(e.toString());
      }
    } finally {
      setState(() => _isEmbedding = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppTheme.danger,
        behavior: SnackBarBehavior.floating,
        content: Text(msg, style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }

  void _showSuccessDialog(Map<String, dynamic> result) {
    final String? token = result['recovery_token'];
    final String base64Image = result['image_data'];
    final Uint8List imageBytes = base64Decode(base64Image);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.verified, color: AppTheme.success),
              SizedBox(width: 10),
              Text("EMBEDDING COMPLETE", style: TextStyle(letterSpacing: 2)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text("Data successfully vanished into the carrier image."),
                const SizedBox(height: 20),
                
                // Image Preview
                Container(
                  height: 200,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(15),
                    border: Border.all(color: Colors.white10),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(15),
                    child: Image.memory(imageBytes, fit: BoxFit.contain),
                  ),
                ),
                
                const SizedBox(height: 10),
                const Text("Generated Stego-Image", style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),

                if (token != null) ...[
                  const SizedBox(height: 25),
                  const Text("SECURE RECOVERY TOKEN", style: TextStyle(color: AppTheme.textMuted, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                  Container(
                    margin: const EdgeInsets.only(top: 10),
                    padding: const EdgeInsets.all(15),
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
                    ),
                    child: SelectableText(token, style: const TextStyle(color: AppTheme.primary, fontFamily: 'monospace', fontSize: 16)),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _downloadImage(imageBytes, "stego_result.png"),
                    icon: const Icon(Icons.download, color: Colors.black),
                    label: const Text("Download Stego-Image"),
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, foregroundColor: Colors.black),
                  ),
                ),
                const SizedBox(height: 10),
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text("CLOSE SECURE CONSOLE", style: TextStyle(color: AppTheme.textMuted)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _downloadImage(Uint8List bytes, String fileName) {
    PlatformUtils.downloadFile(bytes, fileName);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Download Initiated..."),
        backgroundColor: AppTheme.success,
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("1. Select Cover Image", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary)),
          const SizedBox(height: 10),
          _buildImagePicker(),
          const SizedBox(height: 25),
          const Text("2. Select Secret File", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary)),
          const SizedBox(height: 10),
          _buildFilePicker(),
          const SizedBox(height: 25),
          _buildControls(),
          const SizedBox(height: 40),
          _buildEmbedButton(),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Hide Data", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white)),
        const Text("Embed Data", style: TextStyle(fontSize: 18, color: AppTheme.primary, fontWeight: FontWeight.bold)),
        Container(
          height: 4,
          width: 60,
          margin: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(gradient: AppTheme.primaryGradient, borderRadius: BorderRadius.circular(2)),
        ),
        const Text("Embed invisible information using neural-linked steganography.", style: TextStyle(color: AppTheme.textMuted)),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 2, color: AppTheme.primary));
  }

  Widget _buildImagePicker() {
    return InkWell(
      onTap: () async {
        final ImagePicker picker = ImagePicker();
        final XFile? image = await picker.pickImage(source: ImageSource.gallery);
        if (image != null) setState(() => _coverImage = image);
      },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
          child: Container(
            width: double.infinity,
            height: 180,
            decoration: AppTheme.glassDecoration(),
            child: _coverImage == null
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.add_photo_alternate_outlined, size: 40, color: AppTheme.primary.withOpacity(0.5)),
                      const SizedBox(height: 10),
                      Text("Drag & Drop Cover Image", style: TextStyle(color: AppTheme.textMuted.withOpacity(0.5), fontSize: 12)),
                    ],
                  )
                : Stack(
                    fit: StackFit.expand,
                    children: [
                      FutureBuilder(
                        future: _coverImage!.readAsBytes(),
                        builder: (context, snapshot) {
                          if (snapshot.hasData) return Image.memory(snapshot.data!, fit: BoxFit.cover);
                          return const Center(child: CircularProgressIndicator());
                        },
                      ),
                      Center(
                        child: Text(
                          _coverImage!.name, 
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white, backgroundColor: Colors.black54),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildFilePicker() {
    return InkWell(
      onTap: () async {
        FilePickerResult? result = await FilePicker.platform.pickFiles();
        if (result != null) {
          if (kIsWeb) {
            setState(() => _secretFile = XFile.fromData(result.files.single.bytes!, name: result.files.single.name));
          } else {
            setState(() => _secretFile = XFile(result.files.single.path!));
          }
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
        decoration: AppTheme.glassDecoration(),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppTheme.secondary.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.description_outlined, color: AppTheme.secondary),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_secretFile == null ? "Select Secret File" : "File Selected", style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text(_secretFile == null ? "Supports any file type" : _secretFile!.name, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                ],
              ),
            ),
            if (_secretFile != null) const Icon(Icons.check_circle, color: AppTheme.success),
          ],
        ),
      ),
    );
  }

  Widget _buildControls() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: DropdownButtonFormField<String>(
                value: _selectedMethod,
                dropdownColor: AppTheme.surfaceColor,
                decoration: const InputDecoration(labelText: "Method", floatingLabelBehavior: FloatingLabelBehavior.always),
                items: ['LSB', 'Adaptive'].map((m) => DropdownMenuItem(value: m, child: Text(m == 'LSB' ? 'Standard LSB (High Capacity)' : 'Adaptive Edge (High Security)'))).toList(),
                onChanged: (val) => setState(() => _selectedMethod = val!),
              ),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(hintText: "Enter password...", prefixIcon: Icon(Icons.lock_outline, size: 18)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildEmbedButton() {
    return SizedBox(
      width: double.infinity,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(30),
          gradient: AppTheme.primaryGradient,
          boxShadow: [BoxShadow(color: AppTheme.primary.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 5))],
        ),
        child: ElevatedButton(
          onPressed: _isEmbedding ? null : _handleEmbed,
          style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent),
          child: _isEmbedding
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.bgColor))
              : const Text("Encrypt & Embed"),
        ),
      ),
    );
  }
}
