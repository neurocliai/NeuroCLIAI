const fs = require('fs');
const files = [
    'surgical-analyzer.html', 'medical-imaging.html', 'symptom-checker.html',
    'drug-scanner.html', 'code-analyzer.html', 'legal-analyzer.html',
    'meeting-transcriber.html', 'compliance-checker.html'
];

for (let file of files) {
    let content = fs.readFileSync(file, 'utf8').trim();
    if (content.startsWith('"') && content.endsWith('"')) {
        let unescaped;
        try {
            unescaped = JSON.parse(content);
        } catch (e) {
            console.log("Error parsing JSON for " + file + ": " + e);
            continue;
        }
        
        unescaped = unescaped.replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="modules.css">');
        
        // Remove duplicate CSS
        unescaped = unescaped.replace(/body \{ background: var\(--bg-primary\)[^}]+}/g, '');
        unescaped = unescaped.replace(/\.sidebar \{[^}]+}/g, '');
        unescaped = unescaped.replace(/\.sidebar-brand \{[^}]+}/g, '');
        unescaped = unescaped.replace(/\.sidebar-brand img \{[^}]+}/g, '');
        unescaped = unescaped.replace(/\.sidebar-brand span \{[^}]+}/g, '');
        unescaped = unescaped.replace(/\.nav-item \{[^}]+}/g, '');
        unescaped = unescaped.replace(/\.nav-item:hover \{[^}]+}/g, '');
        unescaped = unescaped.replace(/\.nav-item\.active \{[^}]+}/g, '');
        unescaped = unescaped.replace(/\.nav-divider \{[^}]+}/g, '');
        
        const oldSidebar = '<a href="voice-studio.html" class="nav-item"><i class="ph ph-phone-call"></i> Voice Studio</a>';
        const newSidebar = `<a href="voice-studio.html" class="nav-item"><i class="ph ph-phone-call"></i> Voice Studio</a>
    <div class="nav-divider">Medical & Pro Tools</div>
    <a href="surgical-analyzer.html" class="nav-item"><i class="ph ph-video-camera"></i> Surgical Analyzer</a>
    <a href="medical-imaging.html" class="nav-item"><i class="ph ph-scan"></i> Medical Imaging</a>
    <a href="symptom-checker.html" class="nav-item"><i class="ph ph-stethoscope"></i> Symptom Checker</a>
    <a href="drug-scanner.html" class="nav-item"><i class="ph ph-pill"></i> Drug Scanner</a>
    <a href="code-analyzer.html" class="nav-item"><i class="ph ph-code-block"></i> Code Analyzer</a>
    <a href="legal-analyzer.html" class="nav-item"><i class="ph ph-scales"></i> Legal Analyzer</a>
    <a href="meeting-transcriber.html" class="nav-item"><i class="ph ph-microphone"></i> Meeting Transcriber</a>
    <a href="compliance-checker.html" class="nav-item"><i class="ph ph-shield-check"></i> Compliance Checker</a>`;
        
        if (file !== 'surgical-analyzer.html') {
            unescaped = unescaped.replace(oldSidebar, newSidebar);
        }
        
        fs.writeFileSync(file, unescaped, 'utf8');
        console.log('Fixed ' + file);
    }
}
