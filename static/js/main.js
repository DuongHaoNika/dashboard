function updateStats() {
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            // Update CPU
            const cpuText = document.getElementById('cpu-text');
            const cpuBar = document.getElementById('cpu-bar');
            if (cpuText && cpuBar) {
                cpuText.innerText = data.cpu + '%';
                cpuBar.style.width = data.cpu + '%';
            }

            // Update RAM
            const ramText = document.getElementById('ram-text');
            const ramBar = document.getElementById('ram-bar');
            if (ramText && ramBar) {
                ramText.innerText = data.ram + '%';
                ramBar.style.width = data.ram + '%';
            }

            // Update Disk
            const diskText = document.getElementById('disk-text');
            const diskBar = document.getElementById('disk-bar');
            if (diskText && diskBar) {
                diskText.innerText = data.disk + '%';
                diskBar.style.width = data.disk + '%';
            }
        })
        .catch(error => console.error('Error fetching stats:', error));
}

// Initial call
if (document.getElementById('cpu-text')) {
    updateStats();
    // Update every 3 seconds
    setInterval(updateStats, 3000);
}
