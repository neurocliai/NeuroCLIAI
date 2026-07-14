import os, re

folder = r'c:\Users\VISHWANATH\Downloads\AI APP Using Pollinations ai'

files = [
    'script.js',
    'split-chat.html',
    'meeting-transcriber.html',
    'index.html',
    'voice-studio.js',
]

replacements = [
    # Visible terminal log string
    ("Encoding payload for text.pollinations.ai...", "Encoding payload for NeuroCLI AI engine..."),
    # Comments that expose the API
    ("// Fetch sequentially to prevent IP queue full (429) error from Pollinations API",
     "// Fetch sequentially to prevent queue overflow on NeuroCLI AI engine"),
    ("// --- Helper: Send frame to Pollinations Vision and get text ---",
     "// --- Helper: Send frame to NeuroCLI AI Vision engine ---"),
    # Visible description text on index.html
    ("it connects directly to text.pollinations.ai, ensuring",
     "it connects directly to the NeuroCLI AI engine, ensuring"),
    # localStorage key (internal, but tidy)
    ("pollinations_chats", "neurocli_chats"),
]

for fname in files:
    path = os.path.join(folder, fname)
    if not os.path.exists(path):
        print(f'[SKIP] {fname} not found')
        continue
    content = open(path, encoding='utf-8').read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != original:
        open(path, 'w', encoding='utf-8').write(content)
        print(f'[OK] Cleaned: {fname}')
    else:
        print(f'[--] No changes: {fname}')

print('\nDone.')
