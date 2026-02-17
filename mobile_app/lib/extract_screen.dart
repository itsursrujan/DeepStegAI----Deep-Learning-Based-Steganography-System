import 'dart:ui';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'theme.dart';
import 'api_service.dart';
import 'platform_utils.dart'; // Add this

// Removed direct dart:html import

class ExtractScreen extends StatefulWidget {
  const ExtractScreen({super.key});

  @override
  State<ExtractScreen> createState() => _ExtractScreenState();
}

class _ExtractScreenState extends State<ExtractScreen> {
  XFile? _stegoImage;
  final _passwordController = TextEditingController();
  final _tokenController = TextEditingController();
  bool _isExtracting = false;
  bool _useToken = false;

  final _service = DeepStegService();

  Future<void> _handleExtract() async {
    if (_stegoImage == null) return;

    setState(() => _isExtracting = true);

    try {
      final result = await _service.extract(
        stego: _stegoImage!,
        password: _passwordController.text,
        recoveryToken: _tokenController.text,
      );

      if (mounted && result['success'] == true) {
        // QUICK START: Trigger download immediately
        PlatformUtils.downloadFile(result['bytes'], result['filename']);
        _showSuccess(result['filename'], result['bytes']);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: AppTheme.danger, content: Text("Recovery Error: ${e.toString().replaceAll("Exception: ", "")}")),
        );
      }
    } finally {
      setState(() => _isExtracting = false);
    }
  }

  void _showSuccess(String filename, Uint8List bytes) {
    showDialog(
      context: context,
      builder: (ctx) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.lock_open, color: AppTheme.success),
              const SizedBox(width: 10),
              Text("DATA RECOVERED", style: TextStyle(letterSpacing: 2)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text("High-fidelity extraction complete. The payload is ready for deployment."),
              const SizedBox(height: 20),
              Text("Filename: $filename", style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary)),
            ],
          ),
          actions: [
            Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      _downloadFile(bytes, filename);
                      Navigator.pop(ctx);
                    },
                    icon: const Icon(Icons.download, color: Colors.black),
                    label: const Text("SAVE EXTRACTED FILE"),
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.success, foregroundColor: Colors.black),
                  ),
                ),
                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("DISMISS")),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _downloadFile(Uint8List bytes, String fileName) {
    PlatformUtils.downloadFile(bytes, fileName);
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
          const Text("Select Stego Image", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary)),
          const SizedBox(height: 10),
          _buildPicker(),
          const Text("Decryption Password", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary)),
          const SizedBox(height: 10),
          _buildAuthSection(),
          const SizedBox(height: 40),
          _buildExtractButton(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Extract Data", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white)),
        Container(height: 4, width: 60, margin: const EdgeInsets.symmetric(vertical: 8), decoration: BoxDecoration(gradient: AppTheme.primaryGradient, borderRadius: BorderRadius.circular(2))),
        const Text("Extract encrypted payload from stego-carriers.", style: TextStyle(color: AppTheme.textMuted)),
      ],
    );
  }

  Widget _buildPicker() {
    return InkWell(
      onTap: () async {
        final ImagePicker picker = ImagePicker();
        final XFile? image = await picker.pickImage(source: ImageSource.gallery);
        if (image != null) setState(() => _stegoImage = image);
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 50),
        decoration: AppTheme.glassDecoration(),
        child: Column(
          children: [
            Icon(Icons.unarchive, size: 40, color: AppTheme.primary.withOpacity(0.5)),
            const SizedBox(height: 10),
            Text(_stegoImage == null ? "Drag & Drop Stego Image" : "IMAGE ARMED: ${_stegoImage!.name}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildAuthSection() {
    return Column(
      children: [
        SwitchListTile(
          dense: true,
          title: const Text("I lost my password", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          subtitle: const Text("Use Recovery Token", style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
          value: _useToken,
          activeColor: AppTheme.primary,
          onChanged: (val) => setState(() => _useToken = val),
        ),
        const SizedBox(height: 20),
        TextField(
          controller: _useToken ? _tokenController : _passwordController,
          obscureText: !_useToken,
          decoration: InputDecoration(
            labelText: _useToken ? "Recovery Token" : "Decryption Password",
            prefixIcon: Icon(_useToken ? Icons.vpn_key_outlined : Icons.lock_outline),
          ),
        ),
      ],
    );
  }

  Widget _buildExtractButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: _stegoImage == null || _isExtracting ? null : _handleExtract,
        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, foregroundColor: Colors.black),
        icon: const Icon(Icons.flash_on),
        label: _isExtracting ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2)) : const Text("Extract File"),
      ),
    );
  }
}
