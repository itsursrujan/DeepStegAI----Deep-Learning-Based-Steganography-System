import 'dart:ui';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'theme.dart';
import 'api_service.dart';
import 'platform_utils.dart';

class BatchHideScreen extends StatefulWidget {
  const BatchHideScreen({super.key});

  @override
  State<BatchHideScreen> createState() => _BatchHideScreenState();
}

class _BatchHideScreenState extends State<BatchHideScreen> {
  List<XFile> _coverImages = [];
  XFile? _secretFile;
  final _passwordController = TextEditingController();
  bool _isProcessing = false;

  final _service = DeepStegService();

  Future<void> _handleBatchHide() async {
    if (_coverImages.isEmpty || _secretFile == null) return;

    setState(() => _isProcessing = true);

    try {
      final result = await _service.batchEmbed(
        covers: _coverImages,
        secret: _secretFile!,
        password: _passwordController.text,
      );

      if (mounted && result['success'] == true) {
        // QUICK START DOWNLOAD: Trigger immediately before dialog shows
        PlatformUtils.downloadFile(result['bytes'], result['filename']);
        _showSuccess(result['filename']);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: AppTheme.danger, content: Text("Batch Error: ${e.toString().replaceAll("Exception: ", "")}")),
        );
      }
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  void _showSuccess(String filename) {
    showDialog(
      context: context,
      builder: (ctx) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.verified, color: AppTheme.success),
              SizedBox(width: 10),
              Text("BATCH COMPLETE", style: TextStyle(letterSpacing: 2)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text("High-capacity batch embedding finalized. The stego-package has been saved."),
              const SizedBox(height: 20),
              Text("Archive: $filename", style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary)),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("CLOSE")),
          ],
        ),
      ),
    );
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
          _buildCoversPicker(),
          const SizedBox(height: 20),
          _buildSecretPicker(),
          const SizedBox(height: 30),
          _buildPasswordInput(),
          const SizedBox(height: 40),
          _buildProcessButton(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Batch Hiding", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white)),
        const Text("Batch Processing", style: TextStyle(fontSize: 18, color: AppTheme.primary, fontWeight: FontWeight.bold)),
        Container(height: 4, width: 60, margin: const EdgeInsets.symmetric(vertical: 8), decoration: BoxDecoration(gradient: AppTheme.primaryGradient, borderRadius: BorderRadius.circular(2))),
        const Text("Encrypt data into multiple carriers in one operation.", style: TextStyle(color: AppTheme.textMuted)),
      ],
    );
  }

  Widget _buildCoversPicker() {
    return InkWell(
      onTap: () async {
        final ImagePicker picker = ImagePicker();
        final List<XFile> images = await picker.pickMultiImage();
        if (images.isNotEmpty) setState(() => _coverImages = images);
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(30),
        decoration: AppTheme.glassDecoration(),
        child: Column(
          children: [
            Icon(Icons.add_photo_alternate_outlined, size: 50, color: AppTheme.primary.withOpacity(0.5)),
            const SizedBox(height: 15),
            Text(
              _coverImages.isEmpty ? "Select Cover Images" : "${_coverImages.length} Images Selected",
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSecretPicker() {
    return InkWell(
      onTap: () async {
        final ImagePicker picker = ImagePicker();
        // For simplicity reusing image picker or could use file picker. 
        // User web app allows any file, but mobile image picker is easier to setup without extra plugins
        final XFile? file = await picker.pickImage(source: ImageSource.gallery);
        if (file != null) setState(() => _secretFile = file);
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: AppTheme.glassDecoration(color: Colors.white10),
        child: Row(
          children: [
            const Icon(Icons.attach_file, color: AppTheme.primary),
            const SizedBox(width: 15),
            Expanded(
              child: Text(
                _secretFile == null ? "Select Secret File" : "Selected: ${_secretFile!.name}",
                style: const TextStyle(fontSize: 14),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPasswordInput() {
    return TextField(
      controller: _passwordController,
      obscureText: true,
      decoration: const InputDecoration(
        labelText: "Password (Optional)",
        prefixIcon: Icon(Icons.lock_person_outlined),
      ),
    );
  }

  Widget _buildProcessButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: _coverImages.isEmpty || _secretFile == null || _isProcessing ? null : _handleBatchHide,
        icon: const Icon(Icons.layers),
        label: _isProcessing 
            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2)) 
            : const Text("Process Batch Hide"),
      ),
    );
  }
}
