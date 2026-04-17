import os
import psutil
import requests
import socket
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
# ... rest of imports unchanged
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from bson.objectid import ObjectId
from datetime import datetime, timezone, timedelta

load_dotenv(os.path.join(os.getcwd(), '.env'))

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-key-123")

# Debug print (Optional - remove later)
# print(f"API KEY Loaded: {'Yes' if os.getenv('SECURITYTRAILS_API_KEY') else 'No'}")

# MongoDB Atlas Setup
client = MongoClient(os.getenv("MONGO_URI"))
db = client.redteam_db
users_collection = db.users

# Login Manager
login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

class User(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data['_id'])
        self.username = user_data['username']

@login_manager.user_loader
def load_user(user_id):
    user_data = users_collection.find_one({"_id": ObjectId(user_id)})
    if user_data:
        return User(user_data)
    return None

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user_data = users_collection.find_one({"username": username})
        if user_data and check_password_hash(user_data['password'], password):
            user_obj = User(user_data)
            login_user(user_obj)
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password', 'error')
            
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/')
@login_required
def index():
    return render_template('dashboard.html')

import socket

@app.route('/api/stats')
@login_required
def get_stats():
    # Get local IP
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        ip_addr = s.getsockname()[0]
    except Exception:
        ip_addr = '127.0.0.1'
    finally:
        s.close()

    # Get CPU Temperature (Works on Raspberry Pi/Linux)
    cpu_temp = None
    if os.path.exists("/sys/class/thermal/thermal_zone0/temp"):
        with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
            cpu_temp = round(int(f.read()) / 1000, 1)
    elif hasattr(psutil, "sensors_temperatures"):
        temps = psutil.sensors_temperatures()
        if "cpu_thermal" in temps:
            cpu_temp = temps["cpu_thermal"][0].current
        elif "coretemp" in temps:
            cpu_temp = temps["coretemp"][0].current

    stats = {
        "cpu": psutil.cpu_percent(interval=None),
        "ram": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent,
        "boot_time": psutil.boot_time(),
        "ip": ip_addr,
        "temp": cpu_temp if cpu_temp else "N/A"
    }
    return jsonify(stats)

@app.route('/change_password', methods=['GET', 'POST'])
@login_required
def change_password():
    if request.method == 'POST':
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        user_data = users_collection.find_one({"_id": ObjectId(current_user.id)})
        
        if not check_password_hash(user_data['password'], current_password):
            flash('Current password is incorrect', 'error')
        elif new_password != confirm_password:
            flash('New passwords do not match', 'error')
        else:
            hashed_password = generate_password_hash(new_password)
            users_collection.update_one(
                {"_id": ObjectId(current_user.id)},
                {"$set": {"password": hashed_password}}
            )
            flash('Password updated successfully', 'success')
            return redirect(url_for('index'))
            
    return render_template('change_password.html')

@app.route('/revshell')
@login_required
def revshell():
    return render_template('revshell.html')

@app.route('/encoder')
@login_required
def encoder():
    return render_template('encoder.html')

@app.route('/target_status')
@login_required
def target_status():
    return render_template('target_status.html')

@app.route('/scan', methods=['GET', 'POST'])
@login_required
def scan():
    results = None
    domain = None
    if request.method == 'POST':
        domain = request.form.get('domain')
        api_key = os.getenv("SECURITYTRAILS_API_KEY")
        
        if not api_key:
            flash('SecurityTrails API Key not configured', 'error')
        elif domain:
            url = f"https://api.securitytrails.com/v1/domain/{domain}/subdomains"
            headers = {"APIKEY": api_key}
            try:
                response = requests.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    results = [f"{sub}.{domain}" for sub in data.get('subdomains', [])]
                else:
                    flash(f"API Error: {response.status_code} - {response.text}", 'error')
            except Exception as e:
                flash(f"Error: {str(e)}", 'error')
                
    return render_template('scan.html', results=results, domain=domain)

@app.route('/request_tool', methods=['GET', 'POST'])
@login_required
def request_tool():
    results = {"headers": None, "body": None}
    url_input = None
    if request.method == 'POST':
        url_input = request.form.get('url')
        if url_input:
            if not url_input.startswith(('http://', 'https://')):
                url_input = 'http://' + url_input
            
            try:
                # Using GET to fetch both headers and body
                response = requests.get(url_input, timeout=15, allow_redirects=True)
                
                # Format headers
                headers_str = f"HTTP/{response.raw.version/10 if hasattr(response.raw, 'version') else '1.1'} {response.status_code} {response.reason}\n"
                headers_str += "\n".join([f"{k}: {v}" for k, v in response.headers.items()])
                
                results["headers"] = headers_str
                # Truncate body if it's too long for display
                results["body"] = response.text[:10000] + ("\n... [Truncated]" if len(response.text) > 10000 else "")
                
            except Exception as e:
                flash(f"Error: {str(e)}", 'error')
                
    return render_template('request_tool.html', results=results, url_input=url_input)

@app.route('/api/target_check', methods=['POST'])
@login_required
def target_check():
    data = request.json
    target = data.get('target')
    port = data.get('port', 80)
    
    if not target:
        return jsonify({"status": "error", "message": "Target is required"}), 400
    
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((target, int(port)))
        sock.close()
        
        return jsonify({
            "status": "success",
            "open": result == 0,
            "target": target,
            "port": port
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/cve')
@login_required
def cve():
    api_key = "5c74b437-3e7c-47bb-9311-8f8b457a16f5"
    now = datetime.now(timezone.utc)
    # Using 120 days to ensure we get results if 7 days is too narrow for some regions/syncs
    # but the user asked for 7 days in their snippet. I'll stick to 7 days first.
    start_date = (now - timedelta(days=7)).strftime('%Y-%m-%dT%H:%M:%S.000')
    end_date = now.strftime('%Y-%m-%dT%H:%M:%S.000')

    url = f"https://services.nvd.nist.gov/rest/json/cves/2.0/?pubStartDate={start_date}&pubEndDate={end_date}&resultsPerPage=10"
    headers = {"apiKey": api_key}
    
    cves = []
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            data = response.json()
            vulnerabilities = data.get('vulnerabilities', [])
            for v in vulnerabilities:
                cve_data = v.get('cve', {})
                cves.append({
                    "id": cve_data.get('id'),
                    "description": cve_data.get('descriptions', [{}])[0].get('value', 'No description'),
                    "published": cve_data.get('published'),
                    "severity": cve_data.get('metrics', {}).get('cvssMetricV31', [{}])[0].get('cvssData', {}).get('baseSeverity', 'N/A'),
                    "score": cve_data.get('metrics', {}).get('cvssMetricV31', [{}])[0].get('cvssData', {}).get('baseScore', 'N/A')
                })
        else:
            flash(f"NVD API Error: {response.status_code}", 'error')
    except Exception as e:
        flash(f"Error fetching CVEs: {str(e)}", 'error')
        
    return render_template('cve.html', cves=cves)

@app.route('/cve/lookup', methods=['GET', 'POST'])
@login_required
def cve_lookup():
    api_key = "5c74b437-3e7c-47bb-9311-8f8b457a16f5"
    cve_id = request.form.get('cve_id') if request.method == 'POST' else request.args.get('cve_id')
    result = None

    if cve_id:
        cve_id = cve_id.strip().upper()
        url = f"https://services.nvd.nist.gov/rest/json/cves/2.0?cveId={cve_id}"
        headers = {"apiKey": api_key}
        try:
            response = requests.get(url, headers=headers, timeout=15)
            if response.status_code == 200:
                data = response.json()
                if data.get('vulnerabilities'):
                    cve_raw = data['vulnerabilities'][0]['cve']
                    # Parse meaningful data
                    result = {
                        "id": cve_raw.get('id'),
                        "description": cve_raw.get('descriptions', [{}])[0].get('value', 'No description'),
                        "published": cve_raw.get('published'),
                        "last_modified": cve_raw.get('lastModified'),
                        "severity": cve_raw.get('metrics', {}).get('cvssMetricV31', [{}])[0].get('cvssData', {}).get('baseSeverity', 'N/A'),
                        "score": cve_raw.get('metrics', {}).get('cvssMetricV31', [{}])[0].get('cvssData', {}).get('baseScore', 'N/A'),
                        "vector": cve_raw.get('metrics', {}).get('cvssMetricV31', [{}])[0].get('cvssData', {}).get('vectorString', 'N/A'),
                        "references": cve_raw.get('references', [])
                    }
                else:
                    flash(f"CVE ID '{cve_id}' not found.", 'error')
            else:
                flash(f"NVD API Error: {response.status_code}", 'error')
        except Exception as e:
            flash(f"Error lookup CVE: {str(e)}", 'error')

    return render_template('cve_lookup.html', result=result, search_id=cve_id)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')

