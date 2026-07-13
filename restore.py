import json
import re

log_path = r'C:\Users\VISHWANATH\.gemini\antigravity-ide\brain\147211f0-d540-4cab-97f2-2e7d9072d5c3\.system_generated\logs\transcript.jsonl'
files_to_restore = [
    'surgical-analyzer.html', 'medical-imaging.html', 'symptom-checker.html',
    'drug-scanner.html', 'code-analyzer.html', 'legal-analyzer.html',
    'meeting-transcriber.html', 'compliance-checker.html'
]

restored = {}

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'tool_calls' in data:
                for tc in data['tool_calls']:
                    name = tc.get('function', {}).get('name', tc.get('name'))
                    if name in ['default_api:write_to_file', 'write_to_file']:
                        args = tc.get('function', {}).get('arguments', tc.get('args'))
                        if isinstance(args, str):
                            args = json.loads(args)
                        
                        target = args.get('TargetFile', '')
                        for fname in files_to_restore:
                            if fname in target:
                                content = args.get('CodeContent', '')
                                
                                # Use json parsing to unescape it
                                if isinstance(content, str) and content.startswith('"'):
                                    try:
                                        content = json.loads(f'{{"a": {content}}}')['a']
                                    except Exception as e:
                                        pass
                                
                                restored[fname] = content
        except Exception as e:
            pass

for fname, content in restored.items():
    content = content.replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="modules.css">')
    
    # Remove the duplicate inline CSS rules safely
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
    print(f"Restored: {fname}")
