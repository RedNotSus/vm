# Hyperbeam Cloud Console

A web interface for deploying and managing ephemeral virtual browser instances using the [Hyperbeam API](https://hyperbeam.com/). This project provides a simple way to launch cloud-based Chromium instances, connect to them, and manage their lifecycle directly from your browser.

## Features

- **Launchpad:** Quickly deploy new virtual browser instances with a single click.
- **Instance Dashboard:** View a list of all active instances, including their status, session ID, uptime, and profile.
- **Direct Connection:** Connect to running instances and interact with them via an embedded iframe.
- **Session Management:** Terminate instances directly from the dashboard or the active session overlay.
- **Clipboard Support:** Copy session IDs and interact with the virtual browser's clipboard.
- **Responsive UI:** Built with Tailwind CSS for a modern, responsive design.

## How It Works

The console interacts with a backend API (currently configured as `https://api.ch3n.cc/api/hyperbeam`) to:
1. **Create** new Hyperbeam sessions.
2. **List** active sessions.
3. **Retrieve** connection details (embed URLs).
4. **Delete** sessions.

The frontend uses vanilla JavaScript to handle API requests and update the DOM, while Tailwind CSS provides the styling. Lucide Icons are used for the UI iconography.

## Getting Started

### Prerequisites

- A modern web browser.
- Internet connection (to load CDN resources and access the API).

### Installation & Usage

Since this is a static web application, no build process is required.

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Open the application:**
    *   Simply open `index.html` in your web browser.
    *   **OR** for a better experience (to avoid CORS issues with local files depending on browser settings), use a local static server:

    Using Python:
    ```bash
    python3 -m http.server
    # Open http://localhost:8000 in your browser
    ```

    Using Node.js (npx):
    ```bash
    npx serve
    # Open the URL provided in the terminal
    ```

## Project Structure

- `index.html`: The main landing page (Launchpad).
- `instances.html`: The dashboard view for managing running instances.
- `script.js`: Contains all the logic for API interaction, UI updates, and session management.
- `style.css`: Custom styles and Tailwind directives (though Tailwind is loaded via CDN).

## Technologies Used

- **HTML5 & CSS3**
- **JavaScript (ES6+)**
- **[Tailwind CSS](https://tailwindcss.com/)** (via CDN)
- **[Lucide Icons](https://lucide.dev/)** (via CDN)
- **Hyperbeam API**

## API Configuration

The API endpoint is defined in `script.js`:

```javascript
const API_BASE = "https://api.ch3n.cc/api/hyperbeam";
```

If you have your own backend or proxy for the Hyperbeam API, you can update this constant.
