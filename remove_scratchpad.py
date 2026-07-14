import os, re, glob

folder = r'c:\Users\VISHWANATH\Downloads\AI APP Using Pollinations ai'

# Files that have scratchpad nav links
html_files = [
    'voice-studio.html', 'symptom-checker.html', 'surgical-analyzer.html',
    'split-chat.html', 'meeting-transcriber.html', 'medical-imaging.html',
    'legal-analyzer.html', 'drug-scanner.html', 'compliance-checker.html',
    'code-analyzer.html', 'chat.html'
]

NAV_PATTERN = re.compile(r'\s*<a href="scratchpad\.html"[^>]*>.*?AI Scratchpad.*?</a>\n?', re.IGNORECASE)

for f in html_files:
    path = os.path.join(folder, f)
    if not os.path.exists(path): continue
    content = open(path, encoding='utf-8').read()
    new_content = NAV_PATTERN.sub('', content)
    if new_content != content:
        open(path, 'w', encoding='utf-8').write(new_content)
        print(f'[OK] Removed scratchpad nav from: {f}')
    else:
        print(f'[--] No change in: {f}')

print('\nDone with nav links.')
