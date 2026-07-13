import json
log_path = r'C:\Users\VISHWANATH\.gemini\antigravity-ide\brain\147211f0-d540-4cab-97f2-2e7d9072d5c3\.system_generated\logs\transcript.jsonl'
files_to_restore = ['drug-scanner.html']
count = 0
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
                        if 'drug-scanner.html' in target:
                            print(f"FOUND DRUG SCANNER TARGET: {target}")
                            content = args.get('CodeContent', '')
                            # just dump content repr to see what it is
                            print(f"CONTENT REPR: {repr(content[:50])}")
                            count += 1
        except Exception as e:
            pass
print(f"Total found: {count}")
