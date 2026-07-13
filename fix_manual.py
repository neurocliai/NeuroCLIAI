files_to_restore = [
    'surgical-analyzer.html', 'medical-imaging.html', 'symptom-checker.html',
    'drug-scanner.html', 'code-analyzer.html', 'legal-analyzer.html',
    'meeting-transcriber.html', 'compliance-checker.html'
]

for fname in files_to_restore:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read().strip()
        
    if content.startswith('"'):
        # Just slice off the quotes
        content = content.strip('"')
        
        # Manually fix the escaping
        # Replace literal \n with actual newline
        content = content.replace('\\n', '\n')
        # Replace literal \t with actual tab
        content = content.replace('\\t', '\t')
        # Replace literal \" with actual quote
        content = content.replace('\\"', '"')
        # Replace literal \\ with actual backslash
        content = content.replace('\\\\', '\\')
        
        # Apply CSS and sidebar fixes
        content = content.replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="modules.css">')
        
        import re
        content = re.sub(r'body \{ background: var\(--bg-primary\)[^\}]+\}', '', content)
        content = re.sub(r'\.sidebar \{[^\}]+\}', '', content)
        content = re.sub(r'\.sidebar-brand \{[^\}]+\}', '', content)
        content = re.sub(r'\.sidebar-brand img \{[^\}]+\}', '', content)
        content = re.sub(r'\.sidebar-brand span \{[^\}]+\}', '', content)
        content = re.sub(r'\.nav-item \{[^\}]+\}', '', content)
        content = re.sub(r'\.nav-item:hover \{[^\}]+\}', '', content)
        content = re.sub(r'\.nav-item\.active \{[^\}]+\}', '', content)
        content = re.sub(r'\.nav-divider \{[^\}]+\}', '', content)
        
        old_sidebar = '<a href="voice-studio.html" class="nav-item"><i class="ph ph-phone-call"></i> Voice Studio</a>'
        new_sidebar = '''<a href="voice-studio.html" class="nav-item"><i class="ph ph-phone-call"></i> Voice Studio</a>
    <div class="nav-divider">Medical & Pro Tools</div>
    <a href="surgical-analyzer.html" class="nav-item"><i class="ph ph-video-camera"></i> Surgical Analyzer</a>
    <a href="medical-imaging.html" class="nav-item"><i class="ph ph-scan"></i> Medical Imaging</a>
    <a href="symptom-checker.html" class="nav-item"><i class="ph ph-stethoscope"></i> Symptom Checker</a>
    <a href="drug-scanner.html" class="nav-item"><i class="ph ph-pill"></i> Drug Scanner</a>
    <a href="code-analyzer.html" class="nav-item"><i class="ph ph-code-block"></i> Code Analyzer</a>
    <a href="legal-analyzer.html" class="nav-item"><i class="ph ph-scales"></i> Legal Analyzer</a>
    <a href="meeting-transcriber.html" class="nav-item"><i class="ph ph-microphone"></i> Meeting Transcriber</a>
    <a href="compliance-checker.html" class="nav-item"><i class="ph ph-shield-check"></i> Compliance Checker</a>'''
        
        if fname != 'surgical-analyzer.html':
            content = content.replace(old_sidebar, new_sidebar)
        
        with open(fname, 'w', encoding='utf-8') as out:
            out.write(content)
        print(f"Fixed {fname}")
