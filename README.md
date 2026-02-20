# PDF to Word Converter

A premium, web-based PDF to Word converter application built with Flask and TailwindCSS.

## Features

-   **High Fidelity Conversion**: Preserves tables, layout, and fonts from native PDFs using `pdf2docx`.
-   **Modern UI**: Glassmorphism design with soothing animations.
-   **Secure**: Files are processed safely and cleaned up (implementation specific).

## Setup Locally

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/pdf-to-word.git
    cd pdf-to-word
    ```

2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the App**:
    ```bash
    python app.py
    ```
    Access at `http://127.0.0.1:5000`.

## Deployment on Render (Recommended)

This project is configured for **Render** using Docker, which is required for OCR support.

1.  **Push to GitHub**: Upload this repository to your GitHub account.
2.  **Create Web Service**:
    -   Go to [Render Dashboard](https://dashboard.render.com/).
    -   Click **New +** -> **Web Service**.
    -   Connect your repository.
    -   **Important**: Select **Docker** as the Runtime (it should detect the Dockerfile automatically).
3.  **Deploy**: Render will build the image, install Tesseract, and start the app.

Alternatively, you can use the `render.yaml` Blueprint specification.

> [!NOTE]
> **Vercel Users**: Vercel is *not* recommended for this specific app because it cannot easily install the `tesseract-ocr` system dependency required for scanned PDFs. Stick to Render or Fly.io.

## Troubleshooting Deployment

**Error: `libGL.so.1: cannot open shared object file`**
-   **Cause**: This error occurs when the `opencv` library (used by `pdf2docx`) is missing system graphics dependencies.
-   **Solution**: The provided `Dockerfile` fixes this by installing `libgl1` and usage of `opencv-python-headless`. Ensure you are using the **Docker** runtime on Render.

## Tech Stack

-   **Backend**: Python, Flask, pdf2docx
-   **Frontend**: HTML, TailwindCSS, Vanilla JS

## Author

**VIRLIN** - *Vibe Coding Developer*
-   Designed and developed the complete application.
-   Implemented robust PDF processing capabilities.
