import os
import argparse

# --- Configuration ---
EXCLUDED_DIRS = {
    '.git',
    'node_modules',
    '__pycache__',
    'dist',
    'build',
    '.vscode',
    '.idea',
    'test-reports',
    'tests','reporters'
}

EXCLUDED_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.zip', '.rar', '.gz', '.tar',
    '.exe', '.dll', '.so', '.o', '.jar',
    '.mp4', '.mov', '.avi',
    '.mp3', '.wav','.test.js'
    '.lock'
}

def process_project(root_dir, output_file_path):
    """
    Project ko process karta hai: pehle structure banata hai, phir content.
    Yeh debugging messages bhi print karega.
    """
    print("--- SCRIPT STARTING ---")
    print(f"Project Directory: {os.path.abspath(root_dir)}")
    print(f"Excluded Directories: {EXCLUDED_DIRS}")

    # Pehle purani output file ko delete kar dein (agar maujood hai)
    if os.path.exists(output_file_path):
        os.remove(output_file_path)
        print(f"Deleted old output file: {output_file_path}")

    with open(output_file_path, 'w', encoding='utf-8') as output_file:
        # Step 1: Directory Structure
        output_file.write("PROJECT STRUCTURE:\n====================\n\n")
        
        # Step 2: Content
        output_file.write("FILE CONTENTS:\n==============\n\n")

        # os.walk se sab folders aur files ko process karein
        for root, dirs, files in os.walk(root_dir, topdown=True):
            
            # <<< DEBUGGING LINE >>>
            print(f"\nCurrently in directory: {root}")
            
            # Directories ko filter karein
            original_dirs = list(dirs) # Original list ko save karein
            dirs[:] = [d for d in dirs if d.lower() not in EXCLUDED_DIRS]
            
            # <<< DEBUGGING LINES >>>
            # Batayein kon se folders skip kiye gaye
            skipped_dirs = set(original_dirs) - set(dirs)
            if skipped_dirs:
                for skipped in skipped_dirs:
                    print(f"!!! SKIPPING Directory: {skipped} !!!")
            
            # Process files in the current valid directory
            # Pehle structure likhein
            level = root.replace(root_dir, '').count(os.sep)
            if level > 0:
                 output_file.write(f"{' ' * 4 * (level-1)}└── {os.path.basename(root)}/\n")
            
            sub_indent = ' ' * 4 * (level + 1)
            
            for f in sorted(files):
                 if not any(f.lower().endswith(ext) for ext in EXCLUDED_EXTENSIONS):
                    output_file.write(f"{sub_indent}├── {f}\n")
            
            # Phir content likhein
            for filename in sorted(files):
                if any(filename.lower().endswith(ext) for ext in EXCLUDED_EXTENSIONS):
                    continue

                file_path = os.path.join(root, filename)
                relative_path = os.path.relpath(file_path, root_dir)

                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    output_file.write(f"\n--- START OF FILE: {relative_path} ---\n\n")
                    output_file.write(content)
                    output_file.write(f"\n\n--- END OF FILE: {relative_path} ---\n\n" + "="*80 + "\n\n")

                except Exception as e:
                    output_file.write(f"\n--- Could not read file: {relative_path} (Error: {e}) ---\n\n" + "="*80 + "\n\n")

def main():
    parser = argparse.ArgumentParser(description="Combine project files into a single text file with debugging.")
    parser.add_argument("project_dir", type=str, help="Project ka path.")
    parser.add_argument("output_file", type=str, nargs='?', default="combined_project_code.txt", help="Output file ka naam.")
    args = parser.parse_args()

    if not os.path.isdir(args.project_dir):
        print(f"Error: Directory not found at '{args.project_dir}'")
        return
    
    process_project(args.project_dir, args.output_file)
    print(f"\n--- SCRIPT FINISHED ---")
    print(f"Output saved to '{args.output_file}'")

if __name__ == "__main__":
    main()
