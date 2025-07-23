# Guestbook Backend API Requirements

## Overview
This document outlines the requirements for a simple backend API service that will support the guestbook feature of the Portfolio Terminal application. The backend will be developed as a separate service, allowing the frontend to interact with it via API calls.

## Technical Stack
- **Framework**: Node.js with Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Hosting**: Vercel (serverless functions)
- **API Format**: RESTful JSON API

## Core Features

### 1. Guestbook Entry Management
- Store and retrieve guestbook entries
- Each entry contains: name, message, timestamp
- Entries should be displayed in reverse chronological order (newest first)

### 2. API Endpoints

#### GET `/api/entries`
- Retrieves all guestbook entries
- Pagination support with query parameters:
  - `limit`: number of entries to return (default: 20)
  - `page`: page number (default: 1)
- Response format:
  ```json
  {
    "entries": [
      {
        "id": "string",
        "name": "string",
        "message": "string",
        "date": "ISO date string"
      }
    ],
    "totalEntries": "number",
    "totalPages": "number",
    "currentPage": "number"
  }
  ```

#### POST `/api/entries`
- Creates a new guestbook entry
- Request body format:
  ```json
  {
    "name": "string",
    "message": "string"
  }
  ```
- Response: The created entry with status 201

### 3. Data Validation
- Name: Required, string, 1-50 characters
- Message: Required, string, 1-500 characters
- Server should validate and return appropriate error messages

### 4. Error Handling
- Consistent error response format:
  ```json
  {
    "error": "string",
    "details": "string (optional)"
  }
  ```
- Appropriate HTTP status codes for different error conditions

### 5. CORS Support
- Enable CORS to allow the frontend application to access the API
- Whitelist the frontend domain(s)

### 6. Rate Limiting
- Basic rate limiting to prevent abuse (e.g., max 50 requests per minute per IP)

## Non-Functional Requirements

### 1. Performance
- API response time should be under 500ms for typical requests

### 2. Security
- Input sanitization to prevent XSS attacks
- Basic request validation

### 3. Monitoring
- Basic error logging
- Request/response logging for debugging

## Implementation Notes

### Database Schema
```javascript
const GuestbookEntrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  date: {
    type: Date,
    default: Date.now
  }
});
```

### Deployment Approach
1. Create a new repository for the backend code
2. Deploy as Vercel serverless functions
3. Connect to MongoDB Atlas for database hosting

## Integration with Frontend
- The frontend will make fetch requests to the backend API
- Update the frontend to handle loading states and errors
- Use environment variables to configure API endpoints for different environments