import os
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

load_dotenv()

def add_admin():
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("Error: MONGO_URI not found in .env")
        return

    client = MongoClient(mongo_uri)
    db = client.redteam_db
    users_collection = db.users

    username = input("Enter admin username: ")
    password = input("Enter admin password: ")

    if users_collection.find_one({"username": username}):
        print(f"User {username} already exists.")
        return

    hashed_password = generate_password_hash(password)
    users_collection.insert_one({
        "username": username,
        "password": hashed_password
    })

    print(f"Successfully added admin user: {username}")

if __name__ == "__main__":
    add_admin()
