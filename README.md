# HappyUrbanHorticulture

A mobile application designed to support urban horticulture enthusiasts in managing their gardens, crops, and decision-making processes. This project combines a React Native frontend with a Python FastAPI backend to provide a comprehensive tool for sustainable urban gardening.

## Features

- **Garden Management**: Create and manage multiple garden plots and zones
- **Crop Tracking**: Add, edit, and monitor various crops with detailed information
- **Fertilizer Management**: Manage fertilizer presets and applications
- **Decision Support System (DSS)**: Get recommendations for optimal crop care
- **Weather Integration**: Access weather data for informed gardening decisions
- **Soil Analysis**: Track soil properties and media
- **User Authentication**: Secure user management with Firebase
- **Location Services**: GPS-based location tracking for garden sites

## Tech Stack

### Frontend
- **React Native** with **Expo**
- **TypeScript**
- **Expo Router** for navigation
- **Firebase** for authentication and data storage
- **Axios** for API communication

### Backend
- **Python** with **FastAPI**
- **SQLAlchemy** for database operations
- **Firebase** for cloud services
- **Uvicorn** as ASGI server

### Media Management
 
- **Cloudinary** for image management

## Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- Expo CLI
- Firebase project setup
- Virtual environment for Python (recommended)

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up Firebase configuration:
   - Place your `serviceAccountKey.json` in the `backend/app/` directory
   - Configure Firebase settings in `backend/app/db/firebase_config.py`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Update `frontend/src/config/firebase.ts` with your Firebase configuration

## Running the Application

### Start the Backend

1. Activate the virtual environment (if not already):
   ```bash
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

The backend will be available at `http://localhost:8000`

### Start the Frontend

1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Start the Expo development server:
   ```bash
   npx expo start
   ```

3. Follow the instructions to run on your preferred platform (iOS, Android, or Web)

## API Documentation

Once the backend is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── data/         # Static data files
│   │   ├── db/           # Database configuration
│   │   ├── models/       # Data models
│   │   └── services/     # Business logic services
│   ├── requirements.txt
│   └── main.py
├── frontend/
│   ├── app/              # Expo Router screens
│   ├── assets/           # Images and resources
│   ├── components/       # Reusable UI components
│   ├── constants/        # App constants
│   ├── hooks/            # Custom React hooks
│   └── src/
│       ├── api/          # API client
│       ├── config/       # Configuration files
│       └── services/     # Frontend services
└── docs/                 # Documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

- Built with Expo and React Native
- Powered by FastAPI and Python
- Firebase for backend services
- Couldinary for media service management (image)