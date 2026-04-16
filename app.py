import os
import psutil
import requests
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from bson.objectid import ObjectId

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

@app.route('/api/stats')
@login_required
def get_stats():
    stats = {
        "cpu": psutil.cpu_percent(interval=None),
        "ram": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent,
        "boot_time": psutil.boot_time()
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
