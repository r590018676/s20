# S20 Project

A Node.js and Express based project with user authentication capabilities.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

The server will start on port 3000 by default.

## Project Structure

- `/src` - Main application logic
- `/public` - Static assets
- `/views` - HTML files
- `/data` - Contains credentials.json
- `/configs` - Configuration files (if needed)

### credentials.json

The `credentials.json` file in the `/data` directory contains user authentication information. It stores an array of user objects with the following structure:

```json
{
  "type": "user|admin",
  "name": "User's full name",
  "loginId": "Unique login identifier",
  "password": "User's password"
}
```

**Note:** In a production environment, never store passwords in plain text. This is just for initial development purposes.