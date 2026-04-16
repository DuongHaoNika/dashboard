# RedTeam Personal Dashboard

A Flask-based personal dashboard for RedTeamers and Pentesters. Features include system monitoring (CPU, RAM, Disk), quick access to common tools, and secure authentication with MongoDB Atlas.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables**
   Open `.env` and replace the placeholder values with your actual MongoDB URI and a secure secret key.
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `SECRET_KEY`: A long, random string for Flask session security.

3. **Create Admin User**
   Run the utility script to create your login credentials in the database:
   ```bash
   python add_admin.py
   ```

4. **Run the Application**
   ```bash
   python app.py
   ```
   The dashboard will be available at `http://localhost:5000`.

## Features
- **Secure Login**: Only authenticated users can access the dashboard.
- **Live System Stats**: Real-time monitoring of CPU, RAM, and Disk usage using `psutil`.
- **Pentest Toolbox**: One-click access to CyberChef, RevShells, GTFOBins, HackTricks, and more.
- **Quick Notes**: A dedicated area for temporary session notes.
- **Dark Mode**: Optimized for low-light environments and a "Hacker" aesthetic.


```
# Add cloudflare gpg key
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-public-v2.gpg | sudo tee /usr/share/keyrings/cloudflare-public-v2.gpg >/dev/null

# Add this repo to your apt repositories
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-public-v2.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list

# install cloudflared
sudo apt-get update && sudo apt-get install cloudflared
```

```
sudo cloudflared service install eyJhIjoiZTUyYzRmY2E4YmM0Nzg5MWEyMjUzZDgwOTQzOTY2ZGYiLCJ0IjoiNWRkOTMyNjQtNzBlNi00YjM4LWE2ZTUtMzJlMTRkYjZlYTM1IiwicyI6Ik16STRaRGd4TlRndE1ETmtNaTAwWXpsbExXRTFaV1l0TXpVNE1qZ3hOak14WkdVMyJ9
```
