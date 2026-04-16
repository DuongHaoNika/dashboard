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
