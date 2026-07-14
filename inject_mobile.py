import os

targets = [
    'code-analyzer.html',
    'compliance-checker.html',
    'drug-scanner.html',
    'legal-analyzer.html',
    'medical-imaging.html',
    'meeting-transcriber.html',
    'surgical-analyzer.html',
    'symptom-checker.html'
]

header_html = """    <!-- Mobile Header -->
    <div class="mobile-header">
        <div class="brand">
            <img src="logo.svg" alt="NeuroCLI Logo">
            <span>NeuroCLI AI</span>
        </div>
        <button class="mobile-nav-toggle" onclick="document.querySelector('.sidebar').classList.toggle('open')">
            <i class="ph ph-list"></i>
        </button>
    </div>"""

script_html = """    <script>
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const toggleBtn = document.querySelector('.mobile-nav-toggle');
            if (sidebar && toggleBtn && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    </script>"""

for filename in targets:
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Don't inject if already injected
        if "mobile-header" not in content:
            content = content.replace("<body>", f"<body>\n{header_html}", 1)
            content = content.replace("</body>", f"{script_html}\n</body>", 1)
            
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filename}")
        else:
            print(f"Skipped {filename} (already updated)")
