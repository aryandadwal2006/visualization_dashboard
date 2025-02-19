from pymongo import MongoClient
import json
import os
from config import MONGO_URI, DATABASE_NAME, COLLECTION_NAME

def load_data_to_mongodb():
    try:
        # First check if JSON file exists
        if not os.path.exists('jsondata.json'):
            print("Error: jsondata.json file not found!")
            return

        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        collection = db[COLLECTION_NAME]
        
        # Clear existing data
        collection.delete_many({})
        
        # Read JSON file
        try:
            with open('jsondata.json', 'r', encoding='utf-8') as file:
                data = json.load(file)
                
            if not isinstance(data, list):
                print("Error: JSON data is not in the expected list format")
                return
                
            # Insert data into MongoDB
            if len(data) > 0:
                collection.insert_many(data)
                print(f"Successfully loaded {len(data)} documents into MongoDB")
            else:
                print("Error: No data found in JSON file")
                
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON file: {e}")
            print("Please check if your JSON file is properly formatted")
            
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    load_data_to_mongodb()