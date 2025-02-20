# Image Processing System - Technical Design Document

## 1. System Overview
The system processes CSV files containing product image information, compresses the images, and tracks the processing status. The system is designed to handle tasks asynchronously and provide status updates.

## 2. Core Components

### 2.1 API Layer
- **Upload Controller**: Handles CSV file upload and initial validation
- **Status Controller**: Provides processing status updates
- Primary responsibility: Accept requests and return responses

### 2.2 Service Layer
- **CSV Service**: Validates and parses CSV files
- **Image Service**: Handles image downloading and compression
- **Processing Service**: Manages the overall processing workflow
- Primary responsibility: Business logic implementation

### 2.3 Data Layer
- **Database Service**: Handles all database operations
- Primary responsibility: Data persistence and retrieval

## 3. Technical Specifications

### 3.1 Technology Stack
- **Backend Framework**: Express.js (Node.js)
- **Database**: MongoDB (NoSQL)
- **Image Processing**: Sharp library
- **File Handling**: Multer

### 3.2 Database Schema

## Image Schema:
- const imageSchema = new Schema({
-  name: { type: String, required: true },
-  image: { type: Buffer, required: true },
-  contentType: { type: String, required: true },
-  productName: { type: String, required: true },
-   requestId: { type: String, required: true },
- });

## Status schema:
- const statusSchema = new Schema({
-   status: { type: String, enum: ["Completed", "Pending", "Failed"] },
-   requestId: { type: String, required: true },
- });

### 3.3 API Endpoints

## POST /upload
- Accepts: multipart/form-data (CSV file+ Webhook URL)
- Returns: { requestId: string }

## GET /status?requestId=''
- Returns: {
-    status: string,
-    requestId:string,   
-   }


## 4. Processing Flow

1. **CSV Upload**
   - Validate file format
   - Parse CSV data
   - Create database entry
   - Return requestId

2. **Image Processing**
   - Download images
   - Compress using Sharp (50% quality)
   - Upload processed images
   - Update database

## 5. Error Handling

- File validation errors
- Image download failures
- Processing errors
- Database operation errors

#### POSTMAN COLLECTION #####
{
	"info": {
		"_postman_id": "32a149d2-40ce-4a76-85ae-7774f58a5a43",
		"name": "ImageCompression",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		"_exporter_id": "14414006"
	},
	"item": [
		{
			"name": "upload",
			"request": {
				"method": "GET",
				"header": []
			},
			"response": []
		},
		{
			"name": "status",
			"request": {
				"method": "GET",
				"header": []
			},
			"response": []
		}
	]
}