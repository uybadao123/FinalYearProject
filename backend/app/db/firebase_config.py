# app/db/firebase_config.py
import firebase_admin
from firebase_admin import credentials, firestore


CERT_PATH = "app/serviceAccountKey.json"

# Initialize Firebase app if not already initialized
if not firebase_admin._apps:
    cred = credentials.Certificate(CERT_PATH)
    firebase_admin.initialize_app(cred)
    print("Firebase app initialized successfully.")
else:
    print("Firebase app already initialized.")

# Create Firestore client
db = firestore.client()
print("Firestore client initialized successfully.")
