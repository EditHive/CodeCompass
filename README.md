# CodeCompass

CodeCompass is an AI-powered codebase analysis and exploration system that visualizes dependency graphs, simulates change impacts, and traces execution flows using 3D and 2D interactive graphs. It helps developers understand complex codebases, visualize architectures, and analyze their repository with ease.

## Features

- **Interactive Codebase Map**: Navigate your application's architecture with a highly interactive Node-based graph.
- **Impact Analysis Simulator**: See the potential impact of changing specific files or functions before you write the code.
- **Dependency Graph Navigation**: Browse dependencies intuitively with zooming, panning, and edge analysis.
- **Full-stack Architecture**:
  - **Backend**: FastAPI, GitPython, NetworkX, Uvicorn handling heavy computation and local repo parsing.
  - **Frontend**: React, React Router, Vite, TailwindCSS, D3.js powering seamless user interactions and the UI polish.

## Tech Stack

### Backend
- **Python Framework**: FastAPI
- **Graph Processing**: NetworkX
- **Git Integration**: GitPython
- **LLM/AI Integration**: Pydantic, Dotenv, Python Multipart, Aiofiles

### Frontend
- **React 19**
- **Vite**
- **TailwindCSS 4**
- **Data Visualization**: D3.js
- **Routing**: React Router DOM
- **Code Syntax**: React Syntax Highlighter

## Getting Started

### Prerequisites
- Node.js & npm (for frontend)
- Python 3.9+ (for backend)
- Git (for repository cloning functionality)

### Backend Setup
1. Navigate to the `backend` directory.
   ```sh
   cd backend
   ```
2. Install dependencies.
   ```sh
   pip install -r requirements.txt
   ```
3. Copy the sample environment file and adjust necessary variables.
4. Run the server.
   ```sh
   python main.py
   ```
   The backend auto-analyzes the sample repository on startup and listens at `http://127.0.0.1:8000`.

### Frontend Setup
1. Navigate to the `frontend` directory.
   ```sh
   cd frontend
   ```
2. Install npm packages.
   ```sh
   npm install
   ```
3. Run the development server.
   ```sh
   npm run dev
   ```
4. Open the frontend URL provided in your terminal (usually `http://localhost:5173`).

## Usage
Once the backend and frontend servers are running, you can:
- Explore the interactive nodes on the map.
- Click on any specific file/component node to view its detailed properties, dependencies, and execution flow.
- Review simulated impacts to quickly comprehend integration complexity.
- Upload `.zip` repositories or clone from Git URLs seamlessly within the application UI to analyze custom architectures.

## Author
Developed by the EditHive team.
