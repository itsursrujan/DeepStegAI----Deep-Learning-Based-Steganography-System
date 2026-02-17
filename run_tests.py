import argparse
import unittest
import sys
import os

def run_tests(suite_name):
    # Set proper path so tests can import modules
    project_root = os.path.dirname(os.path.abspath(__file__))
    sys.path.append(project_root)
    
    loader = unittest.TestLoader()
    start_dir = os.path.join(project_root, 'tests')
    
    if suite_name == 'all':
        suite = loader.discover(start_dir)
    elif suite_name == 'unit':
        suite = loader.discover(os.path.join(start_dir, 'unit'))
    elif suite_name == 'integration':
        suite = loader.discover(os.path.join(start_dir, 'integration'))
    elif suite_name == 'system':
        suite = loader.discover(os.path.join(start_dir, 'system'))
    elif suite_name == 'security':
        suite = loader.discover(os.path.join(start_dir, 'security'))
    elif suite_name == 'web':
        suite = loader.discover(os.path.join(start_dir, 'web'))
    else:
        print(f"Unknown suite: {suite_name}")
        return

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DeepStegAI Test Runner")
    parser.add_argument('--suite', type=str, default='all', 
                        choices=['all', 'unit', 'integration', 'system', 'security', 'web'],
                        help='Test suite to run')
    
    args = parser.parse_args()
    
    print(f"Running {args.suite} test suite...")
    success = run_tests(args.suite)
    
    sys.exit(0 if success else 1)
