import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'theme.dart';
import 'api_service.dart';
import 'platform_utils.dart';

class BatchDetectionScreen extends StatefulWidget {
  const BatchDetectionScreen({super.key});

  @override
  State<BatchDetectionScreen> createState() => _BatchDetectionScreenState();
}

class _BatchDetectionScreenState extends State<BatchDetectionScreen> {
  List<XFile> _selectedFiles = [];
  final _passwordController = TextEditingController();
  bool _isProcessing = false;

  final _service = DeepStegService();

  Future<void> _pickFiles() async {
    final FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: true,
    );

    if (result != null) {
      setState(() {
        _selectedFiles = result.files.map((f) => XFile.fromData(f.bytes!, name: f.name)).toList();
      });
    }
  }

  Future<void> _handleBatchExtract() async {
    if (_selectedFiles.isEmpty) return;
    setState(() => _isProcessing = true);

    try {
      final result = await _service.batchExtract(
        stegos: _selectedFiles,
        password: _passwordController.text,
      );

      if (mounted && result['success'] == true) {
        // QUICK START: Trigger download immediately
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
              const Text("Data recovery operation finalized. All extracted payloads have been archived."),
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
          _buildDropZone(),
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
        const Text("Batch Detection", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white)),
        const Text("Batch Processing", style: TextStyle(fontSize: 18, color: AppTheme.primary, fontWeight: FontWeight.bold)),
        Container(height: 4, width: 60, margin: const EdgeInsets.symmetric(vertical: 8), decoration: BoxDecoration(gradient: AppTheme.primaryGradient, borderRadius: BorderRadius.circular(2))),
        const Text("Mass-auditing pixel arrays for covert patterns.", style: TextStyle(color: AppTheme.textMuted)),
      ],
    );
  }

  Widget _buildDropZone() {
    return InkWell(
      onTap: _pickFiles,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 40),
        decoration: AppTheme.glassDecoration(),
        child: Column(
          children: [
            const Icon(Icons.layers_outlined, size: 50, color: AppTheme.primary),
            const SizedBox(height: 15),
            Text(_selectedFiles.isEmpty ? "Select Stego Images (Multiple)" : "${_selectedFiles.length} FILES SELECTED", style: const TextStyle(fontWeight: FontWeight.bold)),
            if (_selectedFiles.isNotEmpty) TextButton(onPressed: _pickFiles, child: const Text("Change Selection", style: TextStyle(color: AppTheme.primary, fontSize: 12))),
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
        labelText: "Password",
        prefixIcon: Icon(Icons.lock_person_outlined),
      ),
    );
  }

  Widget _buildProcessButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: _selectedFiles.isEmpty || _isProcessing ? null : _handleBatchExtract,
        icon: const Icon(Icons.radar),
        label: _isProcessing 
            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2)) 
            : const Text("Process Batch Detection"),
      ),
    );
  }
}
